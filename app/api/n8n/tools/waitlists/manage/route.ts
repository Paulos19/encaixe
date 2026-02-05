import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Definição dos Status Válidos
const StatusEnum = z.enum(['WAITING', 'NOTIFIED', 'CONFIRMED', 'DECLINED', 'CANCELED', 'EXPIRED']);

// Helper para traduzir o "humanês" da IA para o enum do sistema
const normalizeAction = (val: unknown) => {
  let str = String(val || '').toUpperCase().trim();
  
  // 1. Mapeia sinônimos de EDIÇÃO/STATUS
  if (['CHANGE STATUS', 'CHANGE_STATUS', 'UPDATE', 'EDIT', 'ALTERAR', 'MUDAR', 'TROCAR', 'DEFINIR'].includes(str)) {
    return 'CHANGE_STATUS';
  }
  
  // 2. Mapeia sinônimos de REMOÇÃO
  if (['DELETE', 'REMOVE', 'REMOVER', 'DELETAR', 'APAGAR', 'EXCLUIR', 'TIRAR'].includes(str)) {
    return 'DELETE';
  }
  
  // 3. Mapeia sinônimos de FINAL DA FILA
  if (str.includes('MOVE') || str.includes('FINAL') || str.includes('FIM') || str.includes('LAST')) {
    return 'MOVE_LAST';
  }
  
  return str;
};

const ManageSchema = z.object({
  userId: z.string().cuid(),
  entryId: z.string().cuid(),
  
  // ROBUSTEZ MÁXIMA: Normaliza qualquer variação de string para o Enum correto
  action: z.preprocess(
    normalizeAction, 
    z.enum(['DELETE', 'MOVE_LAST', 'CHANGE_STATUS'])
  ),
  
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

    // --- LÓGICA DE CORREÇÃO DE "ALUCINAÇÃO" DA IA ---
    // Às vezes a IA manda o STATUS (ex: "WAITING") diretamente no campo "action".
    // Vamos detectar isso antes da validação do Zod.
    let rawAction = String(body.action || '').toUpperCase().trim();
    const validStatuses = ['WAITING', 'NOTIFIED', 'CONFIRMED', 'DECLINED', 'CANCELED', 'EXPIRED'];
    
    // Se o que veio no "action" for, na verdade, um status válido:
    if (validStatuses.includes(rawAction)) {
      body.newStatus = rawAction;    // Move o valor para o campo certo
      body.action = 'CHANGE_STATUS'; // Define a ação correta
    }
    // -------------------------------------------------

    // Agora validamos com o Schema blindado
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
          data: { addedAt: new Date() } // Joga pro fim da fila atualizando a data de entrada
        });
        message = `Paciente ${entry.patient.name} movido para o final da fila.`;
        break;

      case 'CHANGE_STATUS':
        if (!newStatus) {
          return NextResponse.json({ error: "Para alterar status, o campo 'newStatus' é obrigatório." }, { status: 400 });
        }
        
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
    if (error instanceof z.ZodError) {
      // Retorna erro detalhado se for validação, mas formatado como string simples para a IA ler
      const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      return NextResponse.json({ error: `Dados inválidos: ${issues}` }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Erro ao gerenciar fila' }, { status: 400 });
  }
}