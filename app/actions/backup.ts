'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// --- DATA TYPES ---
interface BackupData {
  patients: any[];
  waitlists: any[];
  waitlistEntries: any[];
  agendaSlots: any[];
}

interface ImportReport {
  success: boolean;
  message?: string;
  error?: string;
  stats?: {
    patients: { imported: number; updated: number; discarded: number; errors: number };
    waitlists: { imported: number; updated: number; discarded: number; errors: number };
    waitlistEntries: { imported: number; updated: number; discarded: number; errors: number };
    agendaSlots: { imported: number; updated: number; discarded: number; errors: number };
  };
}

// --- HELPER COMPONENT COMPARAÇÃO ---
function isIdenticalPatient(pDb: any, pBackup: any): boolean {
  const fields = [
    'name', 'phone', 'email', 'notes', 'insurance', 'cpf', 
    'sex', 'rg', 'address', 'addressNumber', 'neighborhood', 
    'city', 'state', 'zipCode'
  ];
  for (const f of fields) {
    const vDb = pDb[f] || '';
    const vBackup = pBackup[f] || '';
    if (String(vDb).trim() !== String(vBackup).trim()) return false;
  }
  
  // Comparação de datas de nascimento
  const dDb = pDb.birthDate ? new Date(pDb.birthDate).getTime() : 0;
  const dBackup = pBackup.birthDate ? new Date(pBackup.birthDate).getTime() : 0;
  if (dDb !== dBackup) return false;

  return true;
}

function isIdenticalWaitlist(wDb: any, wBackup: any): boolean {
  const vDbDesc = wDb.description || '';
  const vBackupDesc = wBackup.description || '';
  if (vDbDesc.trim() !== vBackupDesc.trim()) return false;
  if (wDb.isActive !== wBackup.isActive) return false;
  return true;
}

// --- EXPORT ACTION ---
export async function exportBackupData() {
  const session = await auth();
  if (!session?.user?.email) return { error: "Não autorizado" };

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });
    if (!user) return { error: "Usuário não encontrado" };
    if (user.role !== "ADMIN") return { error: "Não autorizado" };

    // 1. Pacientes
    const patients = await prisma.patient.findMany({
      where: { managerId: user.id },
      orderBy: { name: 'asc' }
    });

    // 2. Listas de Espera
    const waitlists = await prisma.waitlist.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    const waitlistIds = waitlists.map(w => w.id);

    // 3. Entradas nas Listas
    const waitlistEntries = await prisma.waitlistEntry.findMany({
      where: { waitlistId: { in: waitlistIds } }
    });

    // 4. Slots de Agenda
    const agendaSlots = await prisma.agendaSlot.findMany({
      where: { userId: user.id },
      orderBy: { startTime: 'asc' }
    });

    return {
      success: true,
      data: {
        patients,
        waitlists,
        waitlistEntries,
        agendaSlots
      } as BackupData
    };
  } catch (error: any) {
    console.error("Erro exportBackupData:", error);
    return { error: "Erro crítico ao exportar dados." };
  }
}

// --- IMPORT ACTION ---
export async function importBackupData(backupData: any): Promise<ImportReport> {
  const session = await auth();
  if (!session?.user?.email) return { error: "Não autorizado", success: false };

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });
    if (!user) return { error: "Usuário não encontrado", success: false };
    if (user.role !== "ADMIN") return { error: "Não autorizado", success: false };

    // Validar formato básico do JSON de Backup
    if (
      !backupData ||
      !Array.isArray(backupData.patients) ||
      !Array.isArray(backupData.waitlists) ||
      !Array.isArray(backupData.waitlistEntries) ||
      !Array.isArray(backupData.agendaSlots)
    ) {
      return { error: "Arquivo JSON em formato inválido ou corrompido.", success: false };
    }

    const data = backupData as BackupData;

    // Relatório Estatístico inicial
    const stats = {
      patients: { imported: 0, updated: 0, discarded: 0, errors: 0 },
      waitlists: { imported: 0, updated: 0, discarded: 0, errors: 0 },
      waitlistEntries: { imported: 0, updated: 0, discarded: 0, errors: 0 },
      agendaSlots: { imported: 0, updated: 0, discarded: 0, errors: 0 }
    };

    // Mapas para converter IDs antigos (CUIDs) para os IDs reais no banco (existentes ou recém-criados)
    const patientIdMap: Record<string, string> = {};
    const waitlistIdMap: Record<string, string> = {};

    // ==========================================
    // 1. IMPORTAR PACIENTES
    // ==========================================
    for (const p of data.patients) {
      try {
        if (!p.phone || !p.name) {
          stats.patients.errors++;
          continue;
        }

        // Buscar paciente existente na conta deste manager
        const existing = await prisma.patient.findFirst({
          where: { managerId: user.id, phone: p.phone }
        });

        if (existing) {
          // Verificar se é idêntico
          if (isIdenticalPatient(existing, p)) {
            stats.patients.discarded++;
            patientIdMap[p.id] = existing.id; // Map para usar depois
          } else {
            // Se mudou algum dado relevante, atualizamos o existente
            const birthDate = p.birthDate ? new Date(p.birthDate) : null;
            const updated = await prisma.patient.update({
              where: { id: existing.id },
              data: {
                name: p.name,
                email: p.email || null,
                notes: p.notes || null,
                birthDate,
                insurance: p.insurance || null,
                cpf: p.cpf || null,
                sex: p.sex || null,
                rg: p.rg || null,
                address: p.address || null,
                addressNumber: p.addressNumber || null,
                neighborhood: p.neighborhood || null,
                city: p.city || null,
                state: p.state || null,
                zipCode: p.zipCode || null
              }
            });
            stats.patients.updated++;
            patientIdMap[p.id] = updated.id;
          }
        } else {
          // Não existe, cria novo
          const birthDate = p.birthDate ? new Date(p.birthDate) : null;
          const created = await prisma.patient.create({
            data: {
              managerId: user.id,
              name: p.name,
              phone: p.phone,
              email: p.email || null,
              notes: p.notes || null,
              birthDate,
              insurance: p.insurance || null,
              cpf: p.cpf || null,
              sex: p.sex || null,
              rg: p.rg || null,
              address: p.address || null,
              addressNumber: p.addressNumber || null,
              neighborhood: p.neighborhood || null,
              city: p.city || null,
              state: p.state || null,
              zipCode: p.zipCode || null
            }
          });
          stats.patients.imported++;
          patientIdMap[p.id] = created.id;
        }
      } catch (err) {
        console.error("Erro ao importar paciente:", err);
        stats.patients.errors++;
      }
    }

    // ==========================================
    // 2. IMPORTAR LISTAS DE ESPERA
    // ==========================================
    for (const w of data.waitlists) {
      try {
        if (!w.name) {
          stats.waitlists.errors++;
          continue;
        }

        // Buscar lista por nome do mesmo owner
        const existing = await prisma.waitlist.findFirst({
          where: { ownerId: user.id, name: w.name }
        });

        if (existing) {
          if (isIdenticalWaitlist(existing, w)) {
            stats.waitlists.discarded++;
            waitlistIdMap[w.id] = existing.id;
          } else {
            // Atualiza caso haja descrição diferente ou estado ativo
            const updated = await prisma.waitlist.update({
              where: { id: existing.id },
              data: {
                description: w.description || null,
                isActive: typeof w.isActive === 'boolean' ? w.isActive : true
              }
            });
            stats.waitlists.updated++;
            waitlistIdMap[w.id] = updated.id;
          }
        } else {
          // Cria nova
          const created = await prisma.waitlist.create({
            data: {
              ownerId: user.id,
              name: w.name,
              description: w.description || null,
              isActive: typeof w.isActive === 'boolean' ? w.isActive : true
            }
          });
          stats.waitlists.imported++;
          waitlistIdMap[w.id] = created.id;
        }
      } catch (err) {
        console.error("Erro ao importar lista de espera:", err);
        stats.waitlists.errors++;
      }
    }

    // ==========================================
    // 3. IMPORTAR ENTRADAS EM LISTAS DE ESPERA
    // ==========================================
    for (const entry of data.waitlistEntries) {
      try {
        const resolvedWaitlistId = waitlistIdMap[entry.waitlistId];
        const resolvedPatientId = patientIdMap[entry.patientId];

        if (!resolvedWaitlistId || !resolvedPatientId) {
          stats.waitlistEntries.errors++;
          continue;
        }

        // Buscar se este paciente já está na lista ativa
        const existing = await prisma.waitlistEntry.findFirst({
          where: {
            waitlistId: resolvedWaitlistId,
            patientId: resolvedPatientId
          }
        });

        if (existing) {
          // Se for idêntico
          if (existing.status === entry.status && existing.priority === entry.priority) {
            stats.waitlistEntries.discarded++;
          } else {
            // Atualizar status e prioridade
            await prisma.waitlistEntry.update({
              where: { id: existing.id },
              data: {
                status: entry.status,
                priority: typeof entry.priority === 'number' ? entry.priority : 0
              }
            });
            stats.waitlistEntries.updated++;
          }
        } else {
          // Cria nova entrada
          await prisma.waitlistEntry.create({
            data: {
              waitlistId: resolvedWaitlistId,
              patientId: resolvedPatientId,
              status: entry.status || 'WAITING',
              priority: typeof entry.priority === 'number' ? entry.priority : 0,
              addedAt: entry.addedAt ? new Date(entry.addedAt) : new Date()
            }
          });
          stats.waitlistEntries.imported++;
        }
      } catch (err) {
        console.error("Erro ao importar entrada na lista:", err);
        stats.waitlistEntries.errors++;
      }
    }

    // ==========================================
    // 4. IMPORTAR SLOTS DA AGENDA
    // ==========================================
    for (const slot of data.agendaSlots) {
      try {
        if (!slot.startTime || !slot.endTime) {
          stats.agendaSlots.errors++;
          continue;
        }

        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);

        // Traduz o paciente associado se houver
        let resolvedPatientId: string | null = null;
        if (slot.patientId) {
          resolvedPatientId = patientIdMap[slot.patientId] || null;
        }

        // Buscar slot existente neste exato horário para o médico
        const existing = await prisma.agendaSlot.findFirst({
          where: {
            userId: user.id,
            startTime: slotStart,
            endTime: slotEnd
          }
        });

        if (existing) {
          // Se coincidir status e notas
          const notesDb = existing.notes || '';
          const notesBackup = slot.notes || '';
          const samePatient = existing.patientId === resolvedPatientId;

          if (existing.isBooked === slot.isBooked && notesDb.trim() === notesBackup.trim() && samePatient) {
            stats.agendaSlots.discarded++;
          } else {
            // Atualiza slot com notas e paciente corretos
            await prisma.agendaSlot.update({
              where: { id: existing.id },
              data: {
                isBooked: typeof slot.isBooked === 'boolean' ? slot.isBooked : false,
                notes: slot.notes || null,
                patientId: resolvedPatientId
              }
            });
            stats.agendaSlots.updated++;
          }
        } else {
          // Cria novo slot
          await prisma.agendaSlot.create({
            data: {
              userId: user.id,
              startTime: slotStart,
              endTime: slotEnd,
              isBooked: typeof slot.isBooked === 'boolean' ? slot.isBooked : false,
              notes: slot.notes || null,
              patientId: resolvedPatientId
            }
          });
          stats.agendaSlots.imported++;
        }
      } catch (err) {
        console.error("Erro ao importar slot de agenda:", err);
        stats.agendaSlots.errors++;
      }
    }

    // Limpar cache do Next.js das rotas afetadas
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/patients');
    revalidatePath('/dashboard/waitlists');
    revalidatePath('/dashboard/agenda');

    return {
      success: true,
      message: "Importação concluída com sucesso!",
      stats
    };

  } catch (error: any) {
    console.error("Erro importBackupData:", error);
    return {
      success: false,
      error: "Erro inesperado ao processar arquivo de importação."
    };
  }
}
