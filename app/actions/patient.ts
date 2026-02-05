'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { clinicService } from '@/lib/clinic';

// --- HELPER ---
function formatPhoneForWhatsapp(phone: string | number): string {
  const str = String(phone).replace(/\D/g, '');
  if (str.length === 10 || str.length === 11) return `55${str}`;
  return str;
}

// --- ACTIONS DE LEITURA ---
export async function getInsurancesAction() {
  return await clinicService.getHealthInsurances();
}

// --- ACTIONS DE ESCRITA ---

/**
 * Cria ou Atualiza um paciente na base geral (Sem vincular a lista de espera)
 * Usado em /dashboard/patients
 */
export async function createPatient(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Não autorizado" };

  const rawData = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    notes: formData.get('notes'),
    birthDate: formData.get('birthDate'),
    insurance: formData.get('insurance'),
  };

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: "Usuário não encontrado" };

    const formattedPhone = formatPhoneForWhatsapp(rawData.phone as string);
    const birthDateISO = rawData.birthDate ? new Date(rawData.birthDate as string).toISOString() : null;

    // Upsert: Cria ou atualiza se o telefone já existir para este médico
    await prisma.patient.upsert({
      where: {
        managerId_phone: {
          managerId: user.id,
          phone: formattedPhone
        }
      },
      update: {
        name: rawData.name as string,
        notes: rawData.notes as string,
        birthDate: birthDateISO,
        insurance: rawData.insurance as string
      },
      create: {
        managerId: user.id,
        name: rawData.name as string,
        phone: formattedPhone,
        notes: rawData.notes as string,
        birthDate: birthDateISO,
        insurance: rawData.insurance as string
      }
    });

    revalidatePath('/dashboard/patients');
    return { success: true };
  } catch (error) {
    console.error("Erro createPatient:", error);
    return { error: "Erro ao salvar paciente." };
  }
}

const UpdatePatientSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 letras"),
  phone: z.string().min(10, "Telefone inválido"),
  email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
  birthDate: z.string().optional(), // Recebe string do input type="date"
  insurance: z.string().optional(),
});

/**
 * Cria/Atualiza paciente E adiciona a uma lista de espera específica
 * Usado em /dashboard/waitlists/[id]
 */
export async function addPatientToWaitlist(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Não autorizado" };

  const rawData = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    notes: formData.get('notes'),
    birthDate: formData.get('birthDate'),
    insurance: formData.get('insurance'),
    waitlistId: formData.get('waitlistId'),
  };

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: "Usuário não encontrado" };

    const formattedPhone = formatPhoneForWhatsapp(rawData.phone as string);
    const birthDateISO = rawData.birthDate ? new Date(rawData.birthDate as string).toISOString() : null;

    await prisma.$transaction(async (tx) => {
      // 1. Upsert Paciente
      let patient = await tx.patient.findFirst({
        where: { managerId: user.id, phone: formattedPhone }
      });

      const patientData = {
        managerId: user.id,
        name: rawData.name as string,
        phone: formattedPhone,
        notes: rawData.notes as string,
        birthDate: birthDateISO,
        insurance: rawData.insurance as string
      };

      if (patient) {
        patient = await tx.patient.update({ where: { id: patient.id }, data: patientData });
      } else {
        patient = await tx.patient.create({ data: patientData });
      }

      // 2. Add à Lista
      const existingEntry = await tx.waitlistEntry.findFirst({
        where: {
          waitlistId: rawData.waitlistId as string,
          patientId: patient.id,
          status: { notIn: ['CANCELED', 'EXPIRED', 'DECLINED'] }
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
 * IMPORTAÇÃO EM MASSA
 */
export async function importPatientsFromCsv(waitlistId: string, patientsData: any[]) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Não autorizado" };

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: "Usuário não encontrado" };

    let successCount = 0;
    let errorCount = 0;

    for (const p of patientsData) {
      try {
        const phone = formatPhoneForWhatsapp(p.phone);
        if (phone.length < 10) { errorCount++; continue; }

        let birthDate = null;
        if (p.birthDate) birthDate = new Date(p.birthDate).toISOString();

        await prisma.$transaction(async (tx) => {
          let patient = await tx.patient.findFirst({ where: { managerId: user.id, phone } });

          const pData = {
            managerId: user.id,
            name: p.name,
            phone,
            birthDate,
            insurance: p.insurance,
            notes: p.notes
          };

          if (!patient) {
            patient = await tx.patient.create({ data: pData });
          } else {
             patient = await tx.patient.update({ where: { id: patient.id }, data: pData });
          }

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
        errorCount++;
      }
    }

    revalidatePath(`/dashboard/waitlists/${waitlistId}`);
    return { success: true, count: successCount, errors: errorCount };

  } catch (error) {
    return { error: "Erro crítico na importação." };
  }
}

export async function updatePatient(patientId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Não autorizado" };

  const data = Object.fromEntries(formData.entries());
  const validated = UpdatePatientSchema.safeParse(data);

  if (!validated.success) {
    return { error: "Dados inválidos. Verifique os campos." };
  }

  try {
    // Converter data de nascimento se existir
    let birthDateIso = null;
    if (validated.data.birthDate) {
      birthDateIso = new Date(validated.data.birthDate);
    }

    await prisma.patient.update({
      where: { id: patientId },
      data: {
        name: validated.data.name,
        phone: validated.data.phone,
        email: validated.data.email || null,
        notes: validated.data.notes || null,
        birthDate: birthDateIso,
        insurance: validated.data.insurance || null,
      },
    });

    revalidatePath('/dashboard/patients');
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar paciente:", error);
    return { error: "Erro ao atualizar. Verifique se o telefone já existe." };
  }
}

// Aproveite para adicionar a função de deletar se não tiver
export async function deletePatient(patientId: string) {
    const session = await auth();
    if (!session?.user?.email) return { error: "Não autorizado" };
  
    try {
      await prisma.patient.delete({ where: { id: patientId } });
      revalidatePath('/dashboard/patients');
      return { success: true };
    } catch (error) {
      return { error: "Erro ao excluir paciente." };
    }
  }

  export async function importPatientsBulk(patientsData: any[]) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Não autorizado" };

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: "Usuário não encontrado" };

    let successCount = 0;
    let errorCount = 0;
    const importedNames: string[] = [];

    for (const p of patientsData) {
      try {
        const phone = formatPhoneForWhatsapp(p.phone);
        if (phone.length < 10) { errorCount++; continue; }

        let birthDate = null;
        if (p.birthDate) {
            // Tenta criar data, verificando se é número (Excel date) ou string
            birthDate = !isNaN(Number(p.birthDate)) 
                ? new Date((p.birthDate - (25567 + 2)) * 86400 * 1000).toISOString() // Conversão Excel serial date
                : new Date(p.birthDate).toISOString();
        }

        await prisma.patient.upsert({
          where: {
            managerId_phone: {
              managerId: user.id,
              phone
            }
          },
          update: {
            name: p.name,
            birthDate,
            insurance: p.insurance,
            notes: p.notes
          },
          create: {
            managerId: user.id,
            name: p.name,
            phone,
            birthDate,
            insurance: p.insurance,
            notes: p.notes
          }
        });

        importedNames.push(p.name);
        successCount++;
      } catch (e) {
        errorCount++;
      }
    }

    revalidatePath('/dashboard/patients');
    return { success: true, count: successCount, errors: errorCount, names: importedNames };

  } catch (error) {
    console.error("Erro importPatientsBulk:", error);
    return { error: "Erro crítico na importação." };
  }
}