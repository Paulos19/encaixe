import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clinicService } from '@/lib/clinic';
import { z } from 'zod';

const UpdateSchema = z.object({
  userId: z.string().cuid().optional(),
  managerId: z.string().cuid().optional(),
  patientId: z.string().cuid(),
  data: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    insurance: z.string().optional(),
    notes: z.string().optional(),
    birthDate: z.coerce.date().optional(),
    // Novos campos mapeados
    cpf: z.string().optional(),
    sex: z.string().optional(),
    address: z.string().optional(),
    addressNumber: z.string().optional(),
    zipCode: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    rg: z.string().optional(),
  }),
}).refine(data => data.userId || data.managerId, {
  message: "userId ou managerId é obrigatório",
  path: ["userId"]
});

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { userId, managerId, patientId, data } = UpdateSchema.parse(body);
    const ownerId = userId || managerId!;

    // 1. Atualizar Localmente PRIMEIRO (Para garantir que temos os dados salvos)
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        insurance: data.insurance,
        notes: data.notes,
        birthDate: data.birthDate,
        // Novos campos salvos no banco
        cpf: data.cpf,
        sex: data.sex,
        address: data.address,
        addressNumber: data.addressNumber,
        zipCode: data.zipCode,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        rg: data.rg
      },
    });

    // 2. Verificar Integração Clinic
    const manager = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { plan: true }
    });

    if (manager?.plan === 'PLUS') {
      try {
        console.log(`🏥 [Clinic] Sincronizando dados completos de ${updatedPatient.name}...`);
        
        // Agora usamos os dados JÁ SALVOS no banco (updatedPatient) para garantir integridade
        // Se o dado não veio no request, pega o que já estava no banco
        await clinicService.upsertPatient({
          name: updatedPatient.name,
          mobile: updatedPatient.phone,
          email: updatedPatient.email || "",
          // Campos Clinic Full
          nin: updatedPatient.cpf || "",
          sex: (updatedPatient.sex as "M" | "F") || "M",
          address: updatedPatient.address || "",
          addressNumber: updatedPatient.addressNumber || "",
          zipCode: updatedPatient.zipCode || "",
          birthday: updatedPatient.birthDate ? updatedPatient.birthDate.toISOString().split('T')[0] : undefined,
          // Se precisar adicionar neighborhood/city/state ao serviço, ajuste o lib/clinic.ts
        });
        console.log("✅ [Clinic] Sincronização completa.");
      } catch (err: any) {
        console.error("⚠️ [Clinic] Erro na sincronização:", err.message);
      }
    }

    return NextResponse.json({ success: true, patient: updatedPatient });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating patient' }, { status: 400 });
  }
}