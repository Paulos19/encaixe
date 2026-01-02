'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { register } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    
    const formData = new FormData(event.currentTarget);
    
    startTransition(async () => {
      const result = await register(formData);
      if (result?.error) {
        setError(result.error);
      }
      // Se sucesso, a action faz o redirect, não precisamos tratar aqui
    });
  }

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
      <CardHeader>
        <CardTitle>Crie sua conta</CardTitle>
        <CardDescription>Comece a gerenciar suas filas hoje.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Clínica ou Responsável</Label>
            <Input 
              id="name" 
              name="name" 
              type="text" 
              placeholder="Clínica Saúde" 
              required 
              className="bg-white dark:bg-zinc-900"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="contato@clinica.com" 
              required 
              className="bg-white dark:bg-zinc-900"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              minLength={6}
              required 
              className="bg-white dark:bg-zinc-900"
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : 'Criar conta'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-zinc-500">
        Já tem uma conta?{' '}
        <Link href="/login" className="ml-1 text-zinc-900 dark:text-zinc-100 font-medium hover:underline">
          Faça login
        </Link>
      </CardFooter>
    </Card>
  );
}