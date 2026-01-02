import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ConfirmSchema = z.object({
  waitlistId: z.string().cuid(),
  patientId: z.string().cuid(),
});

export async function POST(request: Request) {
  try {
    // 1. Segurança
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

    // 2. Transação com Verificação de Estado Granular
    const result = await prisma.$transaction(async (tx) => {
      // A. Busca a entrada específica do paciente
      const entry = await tx.waitlistEntry.findFirst({
        where: { waitlistId, patientId }
      });

      if (!entry) {
        throw new Error('NOT_FOUND');
      }

      // B. Verifica o status ATUAL do paciente
      if (entry.status === 'CONFIRMED') {
        // Se já está confirmado, retorna sucesso (Idempotência)
        return { status: 'ALREADY_DONE', entry };
      }

      if (entry.status === 'EXPIRED') {
        throw new Error('EXPIRED'); // Caiu na vassoura
      }

      if (entry.status === 'DECLINED') {
        throw new Error('DECLINED'); // Já tinha dito não
      }

      // C. Verifica Race Condition (Se OUTRA pessoa já pegou a vaga)
      // Assumindo que a lista só comporta 1 confirmação por vez (vaga única)
      const winner = await tx.waitlistEntry.findFirst({
        where: {
          waitlistId: waitlistId,
          status: 'CONFIRMED',
          id: { not: entry.id } // Alguém que não sou eu
        }
      });

      if (winner) {
        throw new Error('TAKEN'); // Perdeu a vaga
      }

      // D. Tudo limpo? Confirma!
      const updatedEntry = await tx.waitlistEntry.update({
        where: { id: entry.id },
        data: { 
          status: 'CONFIRMED',
          updatedAt: new Date()
        }
      });

      // E. Opcional: Pausa a lista
      await tx.waitlist.update({
        where: { id: waitlistId },
        data: { isActive: false }
      });

      return { status: 'SUCCESS', entry: updatedEntry };
    });

    // 3. Respostas HTTP Inteligentes para o n8n
    if (result.status === 'ALREADY_DONE') {
      return NextResponse.json({ success: true, message: 'Você já havia confirmado esta vaga.' }, { status: 200 });
    }

    return NextResponse.json({ success: true, message: 'Vaga confirmada!' }, { status: 200 });

  } catch (error: any) {
    console.error('Erro no confirm:', error.message);

    // Mapeamento de Erros para HTTP Codes
    switch (error.message) {
      case 'NOT_FOUND':
        return NextResponse.json({ error: 'Cadastro não encontrado nesta lista.' }, { status: 404 });
      
      case 'EXPIRED':
        return NextResponse.json({ 
          error: '⏳ O tempo limite para resposta expirou. Fique atento à próxima oportunidade!' 
        }, { status: 410 }); // 410 Gone
      
      case 'DECLINED':
        return NextResponse.json({ 
          error: 'Você já recusou esta oferta anteriormente.' 
        }, { status: 400 });

      case 'TAKEN':
        return NextResponse.json({ 
          error: '⚠️ Poxa, a vaga acabou de ser preenchida por outra pessoa. Te avisaremos da próxima!' 
        }, { status: 409 }); // 409 Conflict

      default:
        return NextResponse.json({ error: 'Erro interno ao processar.' }, { status: 500 });
    }
  }
}