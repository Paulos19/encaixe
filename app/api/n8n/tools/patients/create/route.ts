import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clinicService } from '@/lib/clinic';
import { z } from 'zod';

// Schema Flexível e Robusto
const CreateSchema = z.object({
  userId: z.string().optional(), // Aceita vir vazio do N8N
  managerId: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().optional(),
  insurance: z.string().optional(),
  notes: z.string().optional(),
  
  // Novos Campos (Opcionais na criação, mas a Silvia vai tentar preencher)
  cpf: z.string().optional(),
  birthDate: z.coerce.date().optional(), // Aceita string "1990-05-10" e vira Date
  sex: z.string().optional(),
  address: z.string().optional(),
  zipCode: z.string().optional(),
});

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    console.log("📝 Create Patient Body:", JSON.stringify(body)); // Log para debug

    const data = CreateSchema.parse(body);
    
    // Garante que temos um ID de dono (userId do N8N ou managerId do Front)
    const ownerId = data.userId || data.managerId;
    if (!ownerId) {
        return NextResponse.json({ error: "ID do usuário (userId) não identificado." }, { status: 400 });
    }

    // 1. Verifica Duplicidade Local
    const existing = await prisma.patient.findUnique({
      where: { managerId_phone: { managerId: ownerId, phone: data.phone } }
    });

    if (existing) {
        return NextResponse.json({ error: "Paciente já existe com este telefone.", patientId: existing.id }, { status: 409 });
    }

    // 2. Verificar Integração Clinic (Plano PLUS)
    const manager = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { plan: true }
    });

    let externalId = null;

    if (manager?.plan === 'PLUS') {
      try {
        console.log(`🏥 [Clinic] Criando...`);
        const clinicResult = await clinicService.upsertPatient({
          name: data.name,
          mobile: data.phone,
          nin: data.cpf || "", // Envia CPF se tiver
          birthday: data.birthDate ? data.birthDate.toISOString().split('T')[0] : undefined,
          sex: (data.sex as "M"|"F") || "M",
          email: data.email || "",
          address: data.address || "",
          zipCode: data.zipCode || ""
        });
        if (clinicResult?.id) externalId = clinicResult.id.toString();
      } catch (err: any) {
        console.error("⚠️ [Clinic] Erro (não bloqueante):", err.message);
      }
    }

    // 3. Salvar no Banco Local
    const newPatient = await prisma.patient.create({
      data: {
        managerId: ownerId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        insurance: data.insurance,
        notes: externalId ? `Clinic ID: ${externalId}` : data.notes,
        birthDate: data.birthDate,
        cpf: data.cpf,
        sex: data.sex,
        address: data.address,
        zipCode: data.zipCode
      }
    });

    return NextResponse.json({ success: true, patient: newPatient, clinicId: externalId });

  } catch (error: any) {
    console.error("❌ Erro Create:", error);
    return NextResponse.json({ error: error.message || 'Erro ao processar.' }, { status: 400 });
  }
}