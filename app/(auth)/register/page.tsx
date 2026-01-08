"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PasswordStrength } from "@/components/ui/password-strength";
import { registerAction } from "@/app/actions/auth";

// Schema Robusto (Padrão Seguro)
const RegisterSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "Mínimo de 8 caracteres")
    .regex(/[A-Z]/, "Pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "Pelo menos uma letra minúscula")
    .regex(/[0-9]/, "Pelo menos um número")
    .regex(/[^A-Za-z0-9]/, "Pelo menos um caractere especial"),
});

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  // Monitora a senha para atualizar o medidor em tempo real
  const passwordValue = form.watch("password");

  async function onSubmit(values: z.infer<typeof RegisterSchema>) {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("email", values.email);
    formData.append("password", values.password);

    // Chama a Server Action
    const result = await registerAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      toast.success("Conta criada com sucesso!");
      router.push("/login?registered=true");
    }
  }

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Crie sua conta</CardTitle>
        <CardDescription>
          Comece a automatizar sua lista de espera hoje
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Clínica ou Responsável</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Clínica Saúde" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Profissional</FormLabel>
                  <FormControl>
                    <Input placeholder="contato@clinica.com" {...field} />
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
                    <PasswordInput placeholder="Crie uma senha forte" {...field} />
                  </FormControl>
                  
                  {/* Medidor de Força */}
                  <div className="pt-2">
                    <PasswordStrength password={passwordValue} />
                  </div>
                  
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Conta
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-medium text-amber-600 hover:underline">
            Fazer login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}