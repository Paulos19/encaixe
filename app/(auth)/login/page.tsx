'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authenticate } from '@/app/actions/auth'; // Importe sua action
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    
    const formData = new FormData(event.currentTarget);
    
    startTransition(async () => {
      const result = await authenticate(undefined, formData);
      if (result) {
        setErrorMessage(result);
      }
    });
  }

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
      <CardHeader>
        <CardTitle>Acesse sua conta</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="admin@clinica.com" 
              required 
              className="bg-white dark:bg-zinc-900"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link href="#" className="text-xs text-blue-600 hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              required 
              className="bg-white dark:bg-zinc-900"
            />
          </div>

          {errorMessage && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 rounded-md">
              {errorMessage}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : 'Entrar'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-zinc-500">
        Não tem uma conta?{' '}
        <Link href="/register" className="ml-1 text-zinc-900 dark:text-zinc-100 font-medium hover:underline">
          Cadastre-se
        </Link>
      </CardFooter>
    </Card>
  );
}