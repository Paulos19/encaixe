import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findAndNotifyNextPatient } from '@/app/actions/waitlist';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const dynamic = 'force-dynamic'; // Garante que não faça cache

export async function GET(req: Request) {
  // 1. Segurança com Token Bearer (Opcional, mas recomendado)
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Buscar Listas Ativas que tenham gente esperando
    const waitlists = await prisma.waitlist.findMany({
      where: {
        // isActive: true, // Descomente se tiver essa flag no model Waitlist
        entries: {
          some: { status: 'WAITING' }
        }
      },
      include: { owner: true }
    });

    const results = [];

    for (const list of waitlists) {
      // 3. REGRA DE OURO: Verifica se a lista já está "ocupada"
      // Se tiver alguém com status NOTIFIED, significa que estamos aguardando resposta.
      // Não dispara para o próximo para evitar conflito de vaga.
      const activeOffer = await prisma.waitlistEntry.findFirst({
        where: {
          waitlistId: list.id,
          status: 'NOTIFIED'
        }
      });

      if (activeOffer) {
        results.push({ list: list.name, status: 'skipped_busy_waiting_reply' });
        continue;
      }

      // 4. Buscar o Slot Manual Livre mais próximo
      const nextSlot = await prisma.agendaSlot.findFirst({
        where: {
          userId: list.ownerId,
          isBooked: false,
          startTime: { gt: new Date() } // Apenas slots futuros
        },
        orderBy: { startTime: 'asc' } // O mais cedo primeiro
      });

      if (!nextSlot) {
        results.push({ list: list.name, status: 'no_slots_available' });
        continue;
      }

      // 5. Formatar e Disparar
      const slotTimeFormatted = format(nextSlot.startTime, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
      
      console.log(`[AUTO-OFFER] Disparando vaga ${slotTimeFormatted} para lista ${list.name}`);

      const result = await findAndNotifyNextPatient(
        list.id,
        slotTimeFormatted,
        nextSlot.id // Passamos o ID para ser travado na confirmação
      );

      results.push({ 
        list: list.name, 
        slot: slotTimeFormatted, 
        result: result.success ? 'triggered' : result.error 
      });
    }

    return NextResponse.json({ 
      success: true, 
      processed: results.length, 
      details: results 
    });

  } catch (error: any) {
    console.error("Auto Offer Job Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}