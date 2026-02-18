import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clinicService } from '@/lib/clinic'; // Importar o serviço novo

export async function POST(req: Request) {
  try {
    // 1. Validação de Segurança (API Key do N8N)
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== process.env.N8N_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, managerId, cpf, birthDate } = body;

    if (!name || !phone || !managerId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // 2. Verificar se o Manager é "Clinic" (Plano PLUS)
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      select: { plan: true }
    });

    let externalId = null;
    let clinicData = null;

    // 3. Se for Clinic, criar lá também (Integração Híbrida)
    if (manager?.plan === 'PLUS') {
      try {
        console.log(`🏥 [Clinic] Criando paciente ${name} no sistema legado...`);
        const clinicResult = await clinicService.upsertPatient({
          name,
          mobile: phone,
          nin: cpf || "", // CPF é opcional no chat, mas necessário na Clinic
          birthday: birthDate, // YYYY-MM-DD
          sex: "M", // Default, a Silvia pode perguntar depois
          email: ""
        });
        
        if (clinicResult?.id) {
          externalId = clinicResult.id.toString();
          clinicData = clinicResult;
          console.log(`✅ [Clinic] Sucesso! ID Externo: ${externalId}`);
        }
      } catch (err) {
        console.error("⚠️ [Clinic] Falha ao criar no legado (continuando local):", err);
        // Não bloqueamos a criação local se a integração falhar, mas logamos
      }
    }

    // 4. Criar ou Atualizar no Banco Local (Prisma)
    // O 'upsert' garante que não duplicamos se já existir pelo telefone/manager
    const patient = await prisma.patient.upsert({
      where: {
        managerId_phone: {
          managerId,
          phone,
        },
      },
      update: {
        name,
        // Se conseguimos ID externo, salvamos nos metadados ou notes (se não tiver campo específico)
        notes: externalId ? `Clinic ID: ${externalId}` : undefined
      },
      create: {
        name,
        phone,
        managerId,
        notes: externalId ? `Clinic ID: ${externalId}` : undefined
      },
    });

    return NextResponse.json({ 
      success: true, 
      patient,
      clinicId: externalId, // Retorna para o N8N saber
      message: externalId 
        ? "Paciente criado localmente e na Clínica." 
        : "Paciente criado apenas localmente."
    });

  } catch (error: any) {
    console.error('Erro ao criar paciente:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}