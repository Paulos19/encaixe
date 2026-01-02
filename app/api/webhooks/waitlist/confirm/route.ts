import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validação do Payload que vem do n8n
const ConfirmSchema = z.object({
  waitlistId: z.string().cuid(),
  patientId: z.string().cuid(),
});

export async function POST(request: Request) {
  try {
    // 1. Verificação de Segurança (API Key)
    const apiKey = request.headers.get('x-api-secret');
    if (apiKey !== process.env.N8N_API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = ConfirmSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const { waitlistId, patientId } = validated.data;

    // 2. Transação Atômica (O Juiz)
    const result = await prisma.$transaction(async (tx) => {
      // Passo A: Verifica se a lista ainda está ativa/vazia
      // (Assumindo que uma Lista de Espera ativa busca preencher 1 vaga imediata)
      // Se já houver ALGUÉM confirmado nesta lista recentemente (ex: hoje), bloqueia.
      
      const alreadyFilled = await tx.waitlistEntry.findFirst({
        where: {
          waitlistId: waitlistId,
          status: 'CONFIRMED',
          // Opcional: Adicionar filtro de data se a lista for reutilizável
          // updatedAt: { gte: startOfToday() } 
        }
      });

      if (alreadyFilled) {
        throw new Error('VAGA_OCUPADA');
      }

      // Passo B: Verifica se o paciente realmente estava na fila
      const entry = await tx.waitlistEntry.findFirst({
        where: { waitlistId, patientId }
      });

      if (!entry) {
        throw new Error('PACIENTE_NAO_ENCONTRADO');
      }

      // Passo C: Efetiva a confirmação
      const updatedEntry = await tx.waitlistEntry.update({
        where: { id: entry.id },
        data: { 
          status: 'CONFIRMED',
          updatedAt: new Date()
        }
      });

      // Passo D (Opcional): Pausa a lista para não notificar mais ninguém
      await tx.waitlist.update({
        where: { id: waitlistId },
        data: { isActive: false }
      });

      return updatedEntry;
    });

    // Sucesso Total
    return NextResponse.json({ 
      success: true, 
      message: 'Vaga confirmada com sucesso.',
      data: result 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro na confirmação:', error);

    // Tratamento de Erro de Negócio
    if (error.message === 'VAGA_OCUPADA') {
      return NextResponse.json({ 
        success: false, 
        error: 'Esta vaga acabou de ser preenchida por outra pessoa.' 
      }, { status: 409 }); // 409 Conflict
    }

    if (error.message === 'PACIENTE_NAO_ENCONTRADO') {
      return NextResponse.json({ error: 'Paciente não está na fila.' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}