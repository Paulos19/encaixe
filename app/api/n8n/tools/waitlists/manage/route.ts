import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Definição dos Status Válidos
const StatusEnum = z.enum(['WAITING', 'NOTIFIED', 'CONFIRMED', 'DECLINED', 'CANCELED', 'EXPIRED']);

const ManageSchema = z.object({
  userId: z.string().cuid(),
  entryId: z.string().cuid(),
  
  // ROBUSTEZ: Aceita minúsculo/maiúsculo e remove espaços
  action: z.preprocess((val) => String(val).toUpperCase().trim(), z.enum(['DELETE', 'MOVE_LAST', 'CHANGE_STATUS'])),
  
  // ROBUSTEZ: Aceita minúsculo e valida se é um status real
  newStatus: z.preprocess(
    (val) => val ? String(val).toUpperCase().trim() : undefined, 
    StatusEnum.optional()
  ),
});

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();

    // LÓGICA DE CORREÇÃO AUTOMÁTICA DA IA
    // Se a IA mandou o STATUS dentro do campo ACTION (erro comum), nós corrigimos:
    let rawAction = String(body.action || '').toUpperCase().trim();
    let rawNewStatus = body.newStatus;

    const validStatuses = ['WAITING', 'NOTIFIED', 'CONFIRMED', 'DECLINED', 'CANCELED', 'EXPIRED'];
    
    // Se a "ação" for na verdade um status (ex: "CONFIRMED"), ajustamos:
    if (validStatuses.includes(rawAction)) {
      rawNewStatus = rawAction;      // O status vai para o campo certo
      body.action = 'CHANGE_STATUS'; // A ação vira a correta
      body.newStatus = rawAction;    // Atualiza o body para o Zod validar
    }

    // Agora validamos com o Schema oficial
    const { userId, entryId, action, newStatus } = ManageSchema.parse(body);

    const entry = await prisma.waitlistEntry.findUnique({
      where: { id: entryId },
      include: { waitlist: true, patient: true }
    });

    if (!entry || entry.waitlist.ownerId !== userId) {
      return NextResponse.json({ error: 'Item não encontrado ou acesso negado' }, { status: 404 });
    }

    let result;
    let message = "";

    switch (action) {
      case 'DELETE':
        await prisma.waitlistEntry.delete({ where: { id: entryId } });
        message = `Paciente ${entry.patient.name} removido da fila.`;
        break;

      case 'MOVE_LAST':
        await prisma.waitlistEntry.update({
          where: { id: entryId },
          data: { addedAt: new Date() } // Joga pro fim da fila atualizando a data
        });
        message = `Paciente ${entry.patient.name} movido para o final da fila.`;
        break;

      case 'CHANGE_STATUS':
        if (!newStatus) return NextResponse.json({ error: "Novo status é obrigatório para essa ação." }, { status: 400 });
        
        result = await prisma.waitlistEntry.update({
          where: { id: entryId },
          data: { status: newStatus }
        });
        message = `Status de ${entry.patient.name} alterado para ${newStatus}.`;
        break;
    }

    return NextResponse.json({ success: true, message });

  } catch (error: any) {
    console.error("Manage Waitlist Error:", error);
    // Retorna erro detalhado se for validação Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Erro ao gerenciar fila' }, { status: 400 });
  }
}