import { auth } from "@/auth";
import axios from "axios";
import { format, addDays, isValid } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function DebugClinicPage(props: PageProps) {
  const session = await auth();
  
  if (!session) {
    return <div className="p-10">Logue-se primeiro.</div>;
  }

  const params = await props.searchParams;
  const urlDate = params.date;
  
  // Data inicial segura
  let startDate = urlDate ? new Date(urlDate + "T12:00:00") : new Date();
  if (!isValid(startDate)) startDate = new Date();

  const logs: string[] = [];
  const addLog = (msg: string) => logs.push(`[${new Date().toISOString().split('T')[1].slice(0,8)}] ${msg}`);

  let debugData: any = null;
  let rawResponse: any = null;

  try {
    addLog("🚀 Iniciando Debug Seguro...");

    const baseUrl = process.env.CLINIC_API_URL || process.env.LEGACY_URL;
    const clientId = process.env.CLINIC_CLIENT_ID || process.env.LEGACY_CLIENT_ID;
    const clientSecret = process.env.CLINIC_CLIENT_SECRET || process.env.LEGACY_CLIENT_SECRET;

    if (!baseUrl || !clientId || !clientSecret) throw new Error("Variáveis de ambiente ausentes.");

    // AUTH
    addLog("🔑 Autenticando...");
    const tokenUrl = `${baseUrl}/oauth/v1/token`;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const authRes = await axios.post(tokenUrl, {}, {
      headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/json' },
      timeout: 5000
    });
    const token = authRes.data.access_token;
    addLog("✅ Token OK.");

    // BUSCA SLOTS
    const facilityId = 1;
    const doctorId = 10073;
    const addressId = 1;

    const endDate = addDays(startDate, 7);
    const startStr = format(startDate, "yyyy-MM-dd");
    const endStr = format(endDate, "yyyy-MM-dd");

    const slotsUrl = `${baseUrl}/api/v1/integration/facilities/${facilityId}/doctors/${doctorId}/addresses/${addressId}/available-slots`;
    addLog(`📅 Buscando slots: ${startStr} até ${endStr}`);

    const slotsRes = await axios.get(slotsUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
      params: { start_date: startStr, end_date: endStr },
      timeout: 10000
    });

    rawResponse = slotsRes.data;
    // Tenta pegar o array de itens onde quer que ele esteja
    debugData = slotsRes.data.result?.items || slotsRes.data || [];

    addLog(`📊 Itens encontrados: ${Array.isArray(debugData) ? debugData.length : 'Formato desconhecido'}`);

  } catch (error: any) {
    addLog(`❌ ERRO: ${error.message}`);
    if (error.response) {
      rawResponse = error.response.data;
      addLog(`Status: ${error.response.status}`);
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 font-mono text-sm bg-zinc-50 min-h-screen text-zinc-900">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-300 pb-6 gap-4">
        <div>
           <h1 className="text-2xl font-bold">🕵️ Clinic API Debugger (Safe Mode)</h1>
           <p className="text-zinc-500">Se houver erro de formatação, a página não quebrará.</p>
        </div>

        <form className="flex items-center gap-2 bg-white p-2 rounded shadow-sm border border-zinc-200">
          <label className="text-xs font-bold uppercase text-zinc-500 mr-2">Data Início:</label>
          <Input 
            type="date" 
            name="date" 
            defaultValue={format(startDate, "yyyy-MM-dd")}
            className="w-40 h-9"
          />
          <Button type="submit" size="sm" className="h-9 gap-2">
            <Search className="h-4 w-4" />
            Buscar
          </Button>
        </form>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* LOGS E JSON */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-bold uppercase text-zinc-500 text-xs">Log de Execução</h3>
            <div className="bg-black text-green-400 p-4 rounded-lg shadow-inner font-mono text-xs h-[200px] overflow-auto border border-zinc-800">
              {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold uppercase text-zinc-500 text-xs">Resposta Bruta (JSON)</h3>
            <div className="bg-zinc-900 text-zinc-300 p-4 rounded-lg shadow-inner font-mono text-xs h-[400px] overflow-auto border border-zinc-800">
              {rawResponse ? JSON.stringify(rawResponse, null, 2) : "Sem resposta."}
            </div>
          </div>
        </div>

        {/* PREVIEW SEGURO */}
        <div className="space-y-2">
          <h3 className="font-bold uppercase text-zinc-500 text-xs">Slots Interpretados</h3>
          
          <div className="bg-white border border-zinc-200 rounded-lg p-4 min-h-[500px]">
            {Array.isArray(debugData) && debugData.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {debugData.map((slot: any, i: number) => {
                  // --- LÓGICA DE SEGURANÇA NA RENDERIZAÇÃO ---
                  // Tenta encontrar a data em vários campos possíveis
                  const rawDate = slot.start || slot.date || slot.startTime; 
                  const rawTime = slot.start_time || "";
                  
                  // Monta string combinada se necessário (ex: "2023-10-20" + "14:00")
                  const finalDateStr = (rawDate && rawDate.includes("T")) 
                    ? rawDate 
                    : (rawDate && rawTime) ? `${rawDate}T${rawTime}` : rawDate;

                  const dateObj = new Date(finalDateStr);
                  const isDateValid = isValid(dateObj);

                  return (
                    <div key={i} className="bg-blue-50 border border-blue-200 p-3 rounded hover:bg-blue-100 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-lg text-blue-700">
                           {isDateValid ? format(dateObj, "HH:mm") : "??"}
                        </span>
                        {!isDateValid && <AlertTriangle className="h-4 w-4 text-red-500"/>}
                      </div>
                      
                      <div className="text-xs text-blue-600 font-medium">
                        {isDateValid ? format(dateObj, "dd/MM/yyyy") : "Data Inválida"}
                      </div>
                      
                      <div className="mt-2 pt-2 border-t border-blue-200 text-[10px] text-zinc-500 font-mono">
                        {/* Mostra as chaves do objeto para sabermos o formato */}
                        Keys: {Object.keys(slot).join(", ")}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-2">
                <div className="text-4xl">🤷‍♂️</div>
                <p>Nenhum slot encontrado.</p>
                <p className="text-xs">Verifique o JSON ao lado para ter certeza.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}