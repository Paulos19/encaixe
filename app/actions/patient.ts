'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const AddPatientSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  phone: z.string().min(10, "Telefone inválido"), // Idealmente usar lib de validação E.164
  notes: z.string().optional(),
  waitlistId: z.string().cuid(),
});

export async function addPatientToWaitlist(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Não autorizado" };

  const rawData = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    notes: formData.get('notes'),
    waitlistId: formData.get('waitlistId'),
  };

  const validated = AddPatientSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: "Dados inválidos. Verifique o telefone." };
  }

  const { name, phone, notes, waitlistId } = validated.data;

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: "Usuário não encontrado" };

    // 1. Verifica se a lista pertence ao usuário
    const waitlist = await prisma.waitlist.findUnique({
      where: { id: waitlistId, ownerId: user.id }
    });
    if (!waitlist) return { error: "Lista não encontrada" };

    // 2. Transação: Busca/Cria Paciente -> Cria Entrada na Lista
    await prisma.$transaction(async (tx) => {
      // Tenta encontrar paciente pelo telefone para este médico
      let patient = await tx.patient.findFirst({
        where: { 
          managerId: user.id,
          phone: phone 
        }
      });

      // Se não existe, cria
      if (!patient) {
        patient = await tx.patient.create({
          data: {
            name,
            phone,
            notes,
            managerId: user.id
          }
        });
      } else {
        // Se existe, opcionalmente atualiza notas ou nome se vier diferente? 
        // Por segurança, vamos manter o original, ou atualizar apenas se solicitado.
      }

      // 3. Verifica se já está nesta fila específica
      const existingEntry = await tx.waitlistEntry.findFirst({
        where: {
            waitlistId: waitlist.id,
            patientId: patient.id,
            status: { notIn: ['CANCELED', 'EXPIRED', 'DECLINED'] } // Permite reentrar se saiu
        }
      });

      if (existingEntry) {
        throw new Error("Paciente já está nesta fila.");
      }

      // 4. Adiciona à fila
      await tx.waitlistEntry.create({
        data: {
          waitlistId: waitlist.id,
          patientId: patient.id,
          status: 'WAITING'
        }
      });
    });

    revalidatePath(`/dashboard/waitlists/${waitlistId}`);
    return { success: true };

  } catch (error: any) {
    console.error(error);
    return { error: error.message || "Erro ao adicionar paciente." };
  }
}