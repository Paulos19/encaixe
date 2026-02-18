// app/debug/clinic/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clinicService, ClinicPatientData } from "@/lib/clinic";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Search, UserPlus } from "lucide-react";
import { Label } from "@/components/ui/label";

// Definição correta para Next.js 15+ (Promise)
type Props = {
  searchParams: Promise<{
    action?: string;
    date?: string;
    cpf?: string;
  }>;
};

export default async function ClinicDebugPage({ searchParams }: Props) {
  // Resolve a promise dos params
  const params = await searchParams;
  
  let status = { connection: "pending", message: "" };
  let debugResult: any = null;
  let actionTitle = "Aguardando ação...";

  try {
    // 1. Teste de Conexão Rápido
    const insurances = await clinicService.getHealthInsurances();
    if (insurances) {
      status.connection = "success";
    }

    // 2. Processar Ação
    if (params?.action === "slots") {
      actionTitle = "Buscar Slots";
      const today = new Date();
      if (params.date) {
        const [y, m, d] = params.date.split('-').map(Number);
        today.setFullYear(y, m - 1, d);
      }
      debugResult = await clinicService.getAvailableSlots(today, 30);
    } 
    else if (params?.action === "create_patient") {
      actionTitle = "Criar Paciente";
      const patientData: ClinicPatientData = {
        name: "Paciente Teste Debug",
        mobile: "5541999999999", // Vai ser limpo pelo service
        birthday: "1990-01-01",
        sex: "M",
        nin: params.cpf || "00000000000",
        email: "teste@debug.com",
        address: "Rua Teste",
        addressNumber: "123",
        zipCode: "80000000"
      };

      console.log("🛠️ Debug Action: Criando paciente com CPF", patientData.nin);
      debugResult = await clinicService.upsertPatient(patientData);
    }

  } catch (e: any) {
    status.connection = "error";
    status.message = e.message;
    console.error("Debug Page Error:", e);
    debugResult = { error: e.message, details: e.response?.data || "Sem detalhes" };
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Clinic Integration Debug</h1>
        <span className="text-sm font-mono bg-slate-100 px-3 py-1 rounded">
          Status: {status.connection === "success" ? "Online 🟢" : "Offline 🔴"}
        </span>
      </div>

      {status.connection === "error" && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Erro de Conexão</AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Card: Buscar Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5"/> Buscar Horários</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form>
                <input type="hidden" name="action" value="slots" />
                <div className="flex gap-2">
                    <Input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} />
                    <Button type="submit">Buscar</Button>
                </div>
            </form>
          </CardContent>
        </Card>

        {/* Card: Criar Paciente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5"/> Criar Paciente Teste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form>
                <input type="hidden" name="action" value="create_patient" />
                <div className="space-y-2">
                    <Label>CPF para Teste (11 dígitos)</Label>
                    <Input name="cpf" placeholder="12345678900" required minLength={11} maxLength={14} />
                    <Button type="submit" variant="outline" className="w-full">
                      Tentar Upsert (Com Correção de Formato)
                    </Button>
                </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Resultado */}
      {debugResult && (
        <Card className="bg-slate-950 text-slate-50 border-none shadow-2xl animate-in slide-in-from-bottom-5">
          <CardHeader>
            <CardTitle className="text-slate-200">Resultado: {actionTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto max-h-[500px] text-xs font-mono p-4 rounded bg-slate-900/50">
              {JSON.stringify(debugResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}