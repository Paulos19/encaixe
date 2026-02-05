import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const ChangePasswordSchema = z.object({
  userId: z.string().cuid(),
  currentPassword: z.string().min(1, "Senha atual necessária"),
  newPassword: z.string().min(6, "A nova senha deve ter no mínimo 6 caracteres"),
});

export async function POST(req: Request) {
  // 1. Segurança da API Key
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { userId, currentPassword, newPassword } = ChangePasswordSchema.parse(body);

    // 2. Busca o usuário para pegar o hash atual
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.password) {
      return NextResponse.json({ 
        error: "Usuário não encontrado ou não possui senha definida (Login social?)." 
      }, { status: 404 });
    }

    // 3. Verifica se a senha atual bate com o hash no banco
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ 
        error: "A senha atual informada está incorreta. A troca não foi realizada." 
      }, { status: 401 }); // 401 Unauthorized para senha errada
    }

    // 4. Cria o hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 5. Atualiza no banco
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Senha alterada com sucesso!" 
    });

  } catch (error: any) {
    console.error("Change Password Error:", error);
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Dados inválidos: " + error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Erro ao alterar senha' }, { status: 400 });
  }
}