import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clinicService } from '@/lib/clinic'; // Importação crucial
import { z } from 'zod';

// Schema Flexível: Aceita userId (do N8N) ou managerId (do Front)
const CreateSchema = z.object({
  userId: z.string().cuid().optional(),
  managerId: z.string().cuid().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().optional().or(z.literal('')),
  insurance: z.string().optional(),
  notes: z.string().optional(),
  
  // Campos Estendidos para Clinic
  cpf: z.string().optional(),
  birthDate: z.coerce.date().optional(),
  sex: z.string().optional(),
  address: z.string().optional(),
  zipCode: z.string().optional(),
}).refine(data => data.userId || data.managerId, {
  message: "É necessário enviar userId ou managerId",
  path: ["userId"]
});

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    console.log("📝 Create Patient Request:", JSON.stringify(body));

    // 1. Validação
    const data = CreateSchema.parse(body);
    const ownerId = data.userId || data.managerId!;

    // 2. Verificar se já existe localmente (Evita duplicidade)
    const existing = await prisma.patient.findUnique({
      where: { managerId_phone: { managerId: ownerId, phone: data.phone } }
    });

    if (existing) {
        return NextResponse.json({ 
            error: "Paciente já existe com este telefone.", 
            patientId: existing.id 
        }, { status: 409 });
    }

    // 3. Integração Clinic (AQUI ESTÁ A MÁGICA QUE FALTAVA)
    // Verifica se o usuário tem plano PLUS
    const manager = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { plan: true }
    });

    let externalId = null;

    if (manager?.plan === 'PLUS') {
      try {
        console.log(`🏥 [Clinic] Enviando paciente ${data.name}...`);
        const clinicResult = await clinicService.upsertPatient({
          name: data.name,
          mobile: data.phone,
          nin: data.cpf || "", // Envia CPF se estiver disponível
          birthday: data.birthDate ? data.birthDate.toISOString().split('T')[0] : undefined,
          sex: (data.sex as "M"|"F") || "M",
          email: data.email || "",
          address: data.address || "",
          zipCode: data.zipCode || ""
        });
        
        if (clinicResult?.id) {
          externalId = clinicResult.id.toString();
          console.log(`✅ [Clinic] Sucesso! ID Externo: ${externalId}`);
        }
      } catch (err: any) {
        console.error("⚠️ [Clinic] Falha ao criar no legado (seguindo local):", err.message);
      }
    }

    // 4. Salvar no Banco Local (Prisma)
    // Se o schema.prisma ainda não tiver os campos novos, eles serão ignorados aqui,
    // mas a requisição para a Clinic (passo 3) já terá enviado o que recebeu.
    const newPatient = await prisma.patient.create({
      data: {
        managerId: ownerId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        insurance: data.insurance,
        notes: externalId ? `Clinic ID: ${externalId}` : data.notes,
        birthDate: data.birthDate,
        // Só descomente abaixo se já rodou a migration do schema.prisma
        cpf: data.cpf,
        sex: data.sex,
        address: data.address,
        zipCode: data.zipCode
      }
    });

    return NextResponse.json({ 
      success: true, 
      patient: newPatient, 
      clinicId: externalId 
    });

  } catch (error: any) {
    console.error("❌ Erro Create Patient:", error);
    const msg = error.issues ? error.issues[0].message : (error.message || 'Erro ao processar');
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}