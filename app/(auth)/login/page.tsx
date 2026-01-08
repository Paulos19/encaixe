"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react"; // Se estiver usando Auth.js Client
// Se estiver usando Server Actions puro para login, substitua pela sua action

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input"; // <--- Novo componente
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

// Schema simples para login
const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof LoginSchema>) {
    setLoading(true);
    setError(null);

    try {
      // Login usando NextAuth Client (mais comum para redirecionamentos client-side)
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false, // Controlamos o redirect manualmente para UX melhor
      });

      if (result?.error) {
        setError("Email ou senha incorretos.");
        setLoading(false);
      } else {
        router.push("/dashboard"); // Redirect de sucesso
        router.refresh();
      }
    } catch (err) {
      setError("Ocorreu um erro inesperado.");
      setLoading(false);
    }
  }

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Bem-vindo de volta</CardTitle>
        <CardDescription>
          Insira suas credenciais para acessar o painel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="seu@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    {/* Input com Olho Mágico */}
                    <PasswordInput placeholder="••••••••" {...field} />
                  </FormControl>
                  <Button size="sm" variant="link" className="px-0 font-normal" asChild>
                    <Link href="/forgot-password">Esqueceu a senha?</Link>
                  </Button>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Link href="/register" className="font-medium text-amber-600 hover:underline">
            Criar conta
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}