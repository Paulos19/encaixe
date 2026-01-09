'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { clinicService } from '@/lib/clinic'; // Importe o service atualizado

// --- HELPER ---
function formatPhoneForWhatsapp(phone: string | number): string {
  const str = String(phone).replace(/\D/g, '');
  if (str.length === 10 || str.length === 11) return `55${str}`;
  return str;
}

// --- ACTIONS DE LEITURA ---

// Busca convênios para o frontend (Client Component)
export async function getInsurancesAction() {
  return await clinicService.getHealthInsurances();
}

// --- ACTIONS DE ESCRITA ---

export async function addPatientToWaitlist(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Não autorizado" };

  const rawData = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    notes: formData.get('notes'),
    birthDate: formData.get('birthDate'), // Vem como YYYY-MM-DD do input date
    insurance: formData.get('insurance'),
    waitlistId: formData.get('waitlistId'),
  };

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: "Usuário não encontrado" };

    const formattedPhone = formatPhoneForWhatsapp(rawData.phone as string);
    // Converte para ISO Date ou null se vazio
    const birthDateISO = rawData.birthDate ? new Date(rawData.birthDate as string).toISOString() : null;

    // Transação para garantir integridade (Cria Paciente + Adiciona na Lista)
    await prisma.$transaction(async (tx) => {
      // 1. Upsert Paciente (Cria ou Atualiza se já existir pelo telefone)
      let patient = await tx.patient.findFirst({
        where: { managerId: user.id, phone: formattedPhone }
      });

      if (patient) {
        // Atualiza dados (útil se o paciente mudou de convênio ou corrigiu nome)
        patient = await tx.patient.update({
          where: { id: patient.id },
          data: {
            name: rawData.name as string,
            birthDate: birthDateISO,
            insurance: rawData.insurance as string,
            notes: rawData.notes as string
          }
        });
      } else {
        patient = await tx.patient.create({
          data: {
            managerId: user.id,
            name: rawData.name as string,
            phone: formattedPhone,
            birthDate: birthDateISO,
            insurance: rawData.insurance as string,
            notes: rawData.notes as string
          }
        });
      }

      // 2. Adiciona à Lista (se já não estiver lá)
      const existingEntry = await tx.waitlistEntry.findFirst({
        where: {
          waitlistId: rawData.waitlistId as string,
          patientId: patient.id,
          status: { notIn: ['CANCELED', 'EXPIRED', 'DECLINED'] } // Permite reentrar se foi cancelado antes
        }
      });

      if (!existingEntry) {
        await tx.waitlistEntry.create({
          data: {
            waitlistId: rawData.waitlistId as string,
            patientId: patient.id,
            status: 'WAITING'
          }
        });
      }
    });

    revalidatePath(`/dashboard/waitlists/${rawData.waitlistId}`);
    return { success: true };

  } catch (error: any) {
    console.error(error);
    return { error: "Erro ao processar cadastro." };
  }
}

/**
 * IMPORTAÇÃO EM MASSA (Excel/CSV)
 * Recebe array de objetos JSON direto do frontend
 */
export async function importPatientsFromCsv(waitlistId: string, patientsData: any[]) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Não autorizado" };

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: "Usuário não encontrado" };

    let successCount = 0;
    let errorCount = 0;

    // Processa um por um para garantir validações individuais
    for (const p of patientsData) {
      try {
        const phone = formatPhoneForWhatsapp(p.phone);
        if (phone.length < 10) { errorCount++; continue; } // Pula inválidos

        let birthDate = null;
        if (p.birthDate) {
            // Tenta converter formatos variados (Excel serial date ou string)
            // Se vier string DD/MM/YYYY, precisa tratar
            birthDate = new Date(p.birthDate).toISOString(); 
        }

        await prisma.$transaction(async (tx) => {
          // Upsert Paciente
          let patient = await tx.patient.findFirst({
            where: { managerId: user.id, phone }
          });

          const patientData = {
            managerId: user.id,
            name: p.name,
            phone,
            birthDate,
            insurance: p.insurance, // Nome do convênio vindo da planilha
            notes: p.notes
          };

          if (!patient) {
            patient = await tx.patient.create({ data: patientData });
          } else {
             // Opcional: Atualizar dados na importação também
             patient = await tx.patient.update({ where: { id: patient.id }, data: patientData });
          }

          // Add na Lista
          const entry = await tx.waitlistEntry.findFirst({
            where: { waitlistId, patientId: patient.id, status: { notIn: ['CANCELED', 'EXPIRED', 'DECLINED'] } }
          });

          if (!entry) {
            await tx.waitlistEntry.create({
              data: { waitlistId, patientId: patient.id, status: 'WAITING' }
            });
          }
        });
        successCount++;
      } catch (e) {
        console.error("Falha ao importar linha:", p, e);
        errorCount++;
      }
    }

    revalidatePath(`/dashboard/waitlists/${waitlistId}`);
    return { success: true, count: successCount, errors: errorCount };

  } catch (error) {
    return { error: "Erro crítico na importação." };
  }
}