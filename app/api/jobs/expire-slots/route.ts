import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // 1. Segurança: Verifica se é o n8n chamando
    const apiKey = request.headers.get('x-api-secret');
    if (apiKey !== process.env.N8N_API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Configuração do tempo limite (ex: 30 minutos)
    const TIMEOUT_MINUTES = 30;
    const cutoffTime = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000);

    // 3. Busca e atualiza em massa (Batch Update)
    // Muda de 'NOTIFIED' para 'EXPIRED' quem estourou o tempo
    const result = await prisma.waitlistEntry.updateMany({
      where: {
        status: 'NOTIFIED',
        updatedAt: {
          lt: cutoffTime, // "Less than" = Antes do tempo de corte
        },
      },
      data: {
        status: 'EXPIRED',
        updatedAt: new Date(), // Atualiza a data para registrar quando expirou
      },
    });

    // 4. Retorno para log do n8n
    if (result.count > 0) {
      console.log(`🧹 Vassoura passou: ${result.count} agendamentos expirados.`);
    }

    return NextResponse.json({
      success: true,
      expiredCount: result.count,
      message: `Vassoura executada. ${result.count} registros expirados.`
    });

  } catch (error) {
    console.error('Erro no job de expiração:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}