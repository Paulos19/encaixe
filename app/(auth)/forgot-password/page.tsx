"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, CheckCircle2, Mail, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { forgotPasswordAction, verifyResetCodeAction, resetPasswordAction } from "@/app/actions/auth";

type Step = 'EMAIL' | 'CODE' | 'PASSWORD';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('EMAIL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Data
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 1. Enviar Código para o Email
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await forgotPasswordAction(email);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      toast.success("Código enviado! Verifique seu email.");
      setStep('CODE');
    }
  };

  // 2. Verificar Código
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await verifyResetCodeAction(email, code);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setStep('PASSWORD');
    }
  };

  // 3. Resetar Senha
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await resetPasswordAction(email, code, password);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      toast.success("Senha alterada com sucesso!");
      router.push("/login");
    }
  };

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl w-full">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
          {step === 'EMAIL' && <Mail className="w-6 h-6 text-amber-500" />}
          {step === 'CODE' && <KeyRound className="w-6 h-6 text-amber-500" />}
          {step === 'PASSWORD' && <CheckCircle2 className="w-6 h-6 text-green-500" />}
          Recuperar Acesso
        </CardTitle>
        <CardDescription>
          {step === 'EMAIL' && "Digite seu email para receber o código de recuperação."}
          {step === 'CODE' && `Enviamos um código de 6 dígitos para ${email}.`}
          {step === 'PASSWORD' && "Crie uma nova senha segura para sua conta."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        
        {error && (
          <Alert variant="destructive" className="mb-4 py-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* STEP 1: EMAIL */}
        {step === 'EMAIL' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-2">
              <Input 
                type="email" 
                placeholder="seu@email.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 h-11" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Código
            </Button>
          </form>
        )}

        {/* STEP 2: CÓDIGO */}
        {step === 'CODE' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2 text-center">
              <Input 
                type="text" 
                placeholder="000000" 
                maxLength={6}
                value={code} 
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} // Só números
                className="h-14 text-center text-2xl tracking-[0.5em] font-bold"
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Não recebeu? <button type="button" onClick={() => setStep('EMAIL')} className="text-amber-600 hover:underline">Tentar novamente</button>
              </p>
            </div>
            <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 h-11" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verificar Código
            </Button>
          </form>
        )}

        {/* STEP 3: NOVA SENHA */}
        {step === 'PASSWORD' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <PasswordInput 
                placeholder="Nova Senha" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <PasswordInput 
                placeholder="Confirme a Nova Senha" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 h-11" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar Senha e Entrar
            </Button>
          </form>
        )}

      </CardContent>
      <CardFooter className="justify-center">
        <Link href="/login" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para Login
        </Link>
      </CardFooter>
    </Card>
  );
}