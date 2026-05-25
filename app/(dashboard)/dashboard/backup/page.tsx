import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { BackupClientPage } from './backup-client-page';
import { prisma } from '@/lib/prisma';

// Configuração para carregamento dinâmico
export const dynamic = 'force-dynamic';

export default async function BackupPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Busca a role diretamente no banco de dados para evitar tokens desatualizados do NextAuth
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true }
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-8 pb-8 relative z-10">
      {/* Glow de Background decorativo */}
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/10 to-purple-600/10 rounded-[2rem] blur-3xl -z-10 opacity-30 pointer-events-none" />
      
      <BackupClientPage />
    </div>
  );
}
