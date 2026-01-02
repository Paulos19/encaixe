'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// --- Schemas de Validação ---

// Schema para adicionar diretamente à lista de espera (mantido)
const AddPatientToWaitlistSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  phone: z.string().min(10, "Telefone inválido"),
  notes: z.string().optional(),
  waitlistId: z.string().cuid(),
});

// Schema para criação geral de paciente (novo)
const CreatePatientSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  phone: z.string().min(10, "Telefone inválido"),
  notes: z.string().optional(),
});

// --- Server Actions ---

/**
 * Cria um novo paciente na base geral do médico.
 * Usado na tela dashboard/patients.
 */
export async function createPatient(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Não autorizado" };

  const rawData = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    notes: formData.get('notes'),
  };

  const validated = CreatePatientSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: "Dados inválidos. Verifique o telefone e o nome." };
  }

  const { name, phone, notes } = validated.data;

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { error: "Usuário não encontrado" };

    // Verifica se já existe um paciente com este telefone para este médico
    const existingPatient = await prisma.patient.findFirst({
        where: { 
          managerId: user.id,
          phone: phone 
        }
    });

    if (existingPatient) {
        return { error: "Já existe um paciente cadastrado com este telefone." };
    }

    // Cria o paciente
    await prisma.patient.create({
        data: {
          name,
          phone,
          notes,
          managerId: user.id
        }
    });

    revalidatePath('/dashboard/patients');
    return { success: true };

  } catch (error: any) {
    console.error("Erro ao criar paciente:", error);
    return { error: "Erro interno ao cadastrar paciente." };
  }
}

/**
 * Adiciona um paciente a uma lista de espera específica.
 * Cria o paciente na base se ele ainda não existir.
 */
export async function addPatientToWaitlist(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Não autorizado" };

  const rawData = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    notes: formData.get('notes'),
    waitlistId: formData.get('waitlistId'),
  };

  const validated = AddPatientToWaitlistSchema.safeParse(rawData);

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
        // Se existe, não atualizamos os dados para preservar o histórico,
        // a menos que você queira implementar uma lógica de atualização aqui.
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