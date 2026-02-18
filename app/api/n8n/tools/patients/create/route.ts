import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clinicService } from '@/lib/clinic'; // Integração Clinic
import { z } from 'zod';

// Schema flexível: aceita userId (do N8N) ou managerId (do Frontend)
const CreateSchema = z.object({
  userId: z.string().cuid().optional(),
  managerId: z.string().cuid().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().optional().or(z.literal('')),
  insurance: z.string().optional(),
  notes: z.string().optional(),
  cpf: z.string().optional(),
  birthDate: z.coerce.date().optional(), 
}).refine(data => data.userId || data.managerId, {
  message: "userId ou managerId é obrigatório",
  path: ["userId"]
});

export async function POST(req: Request) {
  // 1. Segurança
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    // 2. Validação (Resolve o erro "Missing fields")
    const data = CreateSchema.parse(body);
    const managerId = data.userId || data.managerId!; // Garante que temos um ID

    // 3. Verificar Plano para Integração Clinic
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      select: { plan: true }
    });

    let externalId = null;

    // 4. Integração Híbrida (Se for PLUS, salva na Clinic)
    if (manager?.plan === 'PLUS') {
      try {
        console.log(`🏥 [Clinic] Criando paciente ${data.name}...`);
        const clinicResult = await clinicService.upsertPatient({
          name: data.name,
          mobile: data.phone,
          nin: data.cpf || "",
          birthday: data.birthDate ? data.birthDate.toISOString().split('T')[0] : undefined,
          sex: "M", // Default
          email: data.email || ""
        });
        
        if (clinicResult?.id) {
          externalId = clinicResult.id.toString();
          console.log(`✅ [Clinic] Sucesso! ID Externo: ${externalId}`);
        }
      } catch (err: any) {
        console.error("⚠️ [Clinic] Falha ao criar no legado:", err.message);
        // Não bloqueia a criação local, apenas loga
      }
    }

    // 5. Salvar no Banco Local (Prisma)
    const patient = await prisma.patient.upsert({
      where: {
        managerId_phone: {
          managerId,
          phone: data.phone,
        },
      },
      update: {
        name: data.name,
        email: data.email || undefined,
        birthDate: data.birthDate || undefined,
        insurance: data.insurance || undefined,
        notes: externalId ? `Clinic ID: ${externalId}` : data.notes,
      },
      create: {
        managerId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        birthDate: data.birthDate,
        insurance: data.insurance,
        notes: externalId ? `Clinic ID: ${externalId}` : data.notes,
      },
    });

    return NextResponse.json({ 
      success: true, 
      patient,
      clinicId: externalId
    });

  } catch (error: any) {
    console.error("Erro Create Patient:", error);
    // Retorna erro amigável se for do Zod, senão o erro genérico
    const msg = error.issues ? error.issues[0].message : (error.message || 'Erro ao criar paciente');
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}