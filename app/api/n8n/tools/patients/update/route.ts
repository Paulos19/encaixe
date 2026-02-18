import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clinicService } from '@/lib/clinic';
import { z } from 'zod';

const UpdateSchema = z.object({
  userId: z.string().cuid().optional(),
  managerId: z.string().cuid().optional(), // Suporte híbrido
  patientId: z.string().cuid(),
  data: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    insurance: z.string().optional(),
    notes: z.string().optional(),
    birthDate: z.coerce.date().optional(),
    cpf: z.string().optional(), // Adicionado campo CPF
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
    
    // Normalização do ID do gestor
    const ownerId = userId || managerId!;

    // 1. Buscar paciente atual
    const existingPatient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!existingPatient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

    // 2. Verificar Plano para Integração Clinic
    const manager = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { plan: true }
    });

    // 3. Integração Clinic (Se for PLUS)
    if (manager?.plan === 'PLUS') {
      try {
        console.log(`🏥 [Clinic] Atualizando paciente ${data.name || existingPatient.name}...`);
        
        // Mescla dados novos com antigos para garantir integridade no envio
        await clinicService.upsertPatient({
          name: data.name || existingPatient.name,
          mobile: data.phone || existingPatient.phone,
          nin: data.cpf || "", // Envia CPF se vier na edição
          birthday: data.birthDate 
            ? data.birthDate.toISOString().split('T')[0] 
            : (existingPatient.birthDate ? existingPatient.birthDate.toISOString().split('T')[0] : undefined),
          sex: "M", 
          email: data.email || existingPatient.email || ""
        });
        console.log("✅ [Clinic] Paciente atualizado no legado.");
      } catch (err: any) {
        console.error("⚠️ [Clinic] Falha ao atualizar:", err.message);
      }
    }

    // 4. Atualizar Localmente
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        insurance: data.insurance,
        notes: data.notes,
        birthDate: data.birthDate,
        // Nota: Não temos campo CPF no prisma schema fornecido, então não salvamos localmente
        // a menos que você adicione ao schema.prisma. Mas enviamos para a Clinic acima.
      },
    });

    return NextResponse.json({ success: true, patient: updatedPatient });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating patient' }, { status: 400 });
  }
}