'use client';

import { useState, useRef } from 'react';
import { exportBackupData, importBackupData } from '@/app/actions/backup';
import { PremiumCard } from '@/components/ui/premium-card';
import { GradientText } from '@/components/ui/gradient-text';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  UploadCloud, 
  DownloadCloud, 
  Users, 
  Calendar, 
  ListTodo, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  FileCode,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export function BackupClientPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Estatísticas de importação
  const [importResult, setImportResult] = useState<{
    patients: { imported: number; updated: number; discarded: number; errors: number };
    waitlists: { imported: number; updated: number; discarded: number; errors: number };
    waitlistEntries: { imported: number; updated: number; discarded: number; errors: number };
    agendaSlots: { imported: number; updated: number; discarded: number; errors: number };
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- DOWNLOAD EXPORT ---
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportBackupData();
      if (result.error) {
        toast.error(result.error);
        return;
      }

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result.data, null, 2));
      const downloadAnchor = document.createElement('a');
      
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `backup-encaixe-ja-${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast.success("Backup exportado e baixado com sucesso!");
    } catch (err) {
      toast.error("Erro ao exportar dados.");
    } finally {
      setIsExporting(false);
    }
  };

  // --- SELEÇÃO DE ARQUIVO ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      toast.error("Selecione apenas arquivos .json");
      return;
    }
    setSelectedFile(file);
    setImportResult(null); // Reseta relatório anterior
  };

  // --- DRAG & DROP ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type === "application/json" || file.name.endsWith(".json")) {
        setSelectedFile(file);
        setImportResult(null); // Reseta relatório anterior
        toast.success(`Arquivo ${file.name} selecionado!`);
      } else {
        toast.error("Por favor, selecione apenas arquivos do tipo .json");
      }
    }
  };

  // --- PROCESSAR IMPORTAÇÃO ---
  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Por favor, selecione um arquivo JSON primeiro.");
      return;
    }

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          const json = JSON.parse(text);
          
          // Envia dados JSON para a Server Action
          const result = await importBackupData(json);
          
          if (result.success && result.stats) {
            setImportResult(result.stats);
            setSelectedFile(null); // Limpa input
            toast.success(result.message || "Importação realizada com sucesso!");
          } else {
            toast.error(result.error || "Ocorreu um erro ao processar o arquivo.");
          }
        } catch (err) {
          toast.error("O arquivo não é um JSON estruturado de forma válida.");
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(selectedFile);
    } catch (err) {
      setIsImporting(false);
      toast.error("Falha ao carregar o arquivo.");
    }
  };

  // --- CÁLCULO DE ESTATÍSTICAS ---
  const totalDiscarded = importResult
    ? (importResult.patients.discarded +
       importResult.waitlists.discarded +
       importResult.waitlistEntries.discarded +
       importResult.agendaSlots.discarded)
    : 0;

  const totalImported = importResult
    ? (importResult.patients.imported +
       importResult.waitlists.imported +
       importResult.waitlistEntries.imported +
       importResult.agendaSlots.imported)
    : 0;

  const totalUpdated = importResult
    ? (importResult.patients.updated +
       importResult.waitlists.updated +
       importResult.waitlistEntries.updated +
       importResult.agendaSlots.updated)
    : 0;

  const totalErrors = importResult
    ? (importResult.patients.errors +
       importResult.waitlists.errors +
       importResult.waitlistEntries.errors +
       importResult.agendaSlots.errors)
    : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-2 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
            <GradientText size="4xl">Backup de Dados</GradientText>
          </div>
          <p className="text-muted-foreground text-sm mt-2">
            Exporte ou importe de maneira segura todos os dados de pacientes, listas de espera e agenda em um único arquivo JSON.
          </p>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid gap-8 md:grid-cols-2">
        
        {/* Card 1: EXPORTAR */}
        <PremiumCard className="p-8 flex flex-col h-full justify-between" glow>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-amber-500/10 rounded-2xl">
                <DownloadCloud className="h-7 w-7 text-amber-500" />
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
                Seguro
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Exportar Banco de Dados</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Gere um arquivo JSON contendo todos os dados clínicos de sua propriedade. Este backup pode ser guardado localmente e usado para restauração a qualquer momento.
              </p>
            </div>

            {/* Lista explicativa dos dados salvos */}
            <div className="bg-zinc-950/20 rounded-2xl p-4 border border-white/5 space-y-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Dados incluídos no backup:</h4>
              <div className="grid grid-cols-2 gap-3 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-amber-400 rounded-full" />
                  <span>Fichas de Pacientes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-amber-400 rounded-full" />
                  <span>Listas de Espera</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-amber-400 rounded-full" />
                  <span>Histórico de Encaixes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-amber-400 rounded-full" />
                  <span>Slots da Agenda</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full py-6 text-base font-bold bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:scale-[1.01] transition-transform text-white rounded-2xl shadow-lg border-0 cursor-pointer"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <DownloadCloud className="mr-2 h-5 w-5" />
                  Gerar e Baixar Backup
                </>
              )}
            </Button>
          </div>
        </PremiumCard>

        {/* Card 2: IMPORTAR */}
        <PremiumCard className="p-8 flex flex-col h-full justify-between" glow delay={0.1}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-purple-500/10 rounded-2xl">
                <UploadCloud className="h-7 w-7 text-purple-500" />
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-purple-500/10 text-purple-500 rounded-full border border-purple-500/20">
                Deduplicador
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Restaurar / Importar JSON</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Carregue um arquivo JSON gerado anteriormente. Nosso importador inteligente irá processar e integrar seus dados sem gerar cadastros duplicados.
              </p>
            </div>

            {/* Dropzone interativa */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[140px] ${
                isDragging 
                  ? 'border-purple-500 bg-purple-500/10 scale-[1.01]' 
                  : selectedFile 
                    ? 'border-emerald-500/50 bg-emerald-500/5' 
                    : 'border-white/10 hover:border-white/20 bg-zinc-950/20'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json"
                className="hidden" 
              />
              
              {selectedFile ? (
                <div className="space-y-2">
                  <FileCode className="h-10 w-10 text-emerald-500 mx-auto animate-pulse" />
                  <p className="text-xs font-bold text-emerald-400">{selectedFile.name}</p>
                  <p className="text-[10px] text-zinc-400">
                    {(selectedFile.size / 1024).toFixed(2)} KB • Pronto para importar
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <UploadCloud className="h-8 w-8 text-zinc-400 mx-auto group-hover:text-purple-400 transition-colors" />
                  <p className="text-xs font-semibold text-zinc-300">
                    Arraste o arquivo JSON ou clique para buscar
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    Apenas formatos JSON exportados pelo painel são suportados
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            {selectedFile && (
              <Button
                variant="outline"
                onClick={() => setSelectedFile(null)}
                className="rounded-2xl py-6 hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Limpar
              </Button>
            )}
            <Button
              onClick={handleImport}
              disabled={isImporting || !selectedFile}
              className={`flex-1 py-6 text-base font-bold transition-transform text-white rounded-2xl shadow-lg border-0 cursor-pointer ${
                selectedFile 
                  ? 'bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:scale-[1.01]' 
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
              }`}
            >
              {isImporting ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-5 w-5" />
                  Processar e Importar
                </>
              )}
            </Button>
          </div>
        </PremiumCard>
      </div>

      {/* Relatório de Importação */}
      <AnimatePresence>
        {importResult && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="space-y-6 mt-8"
          >
            {/* Banner de Aviso de Duplicatas Descartadas */}
            {totalDiscarded > 0 ? (
              <div className="relative rounded-3xl bg-amber-500/10 border border-amber-500/20 p-6 flex flex-col sm:flex-row items-start gap-4 overflow-hidden">
                {/* Glow decorativo de perigo */}
                <div className="absolute top-0 right-0 w-24 h-full bg-amber-500/5 blur-xl rounded-full" />
                <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-300 text-lg">Aviso de Duplicatas Descartadas</h4>
                  <p className="text-zinc-300 text-sm leading-relaxed">
                    Identificamos e descartamos <strong className="text-amber-400 font-extrabold">{totalDiscarded}</strong> registros idênticos que já estavam no banco de dados. 
                    Isso evitou a redundância dos seus dados. Nenhum registro foi corrompido ou sobreecrito desnecessariamente.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative rounded-3xl bg-emerald-500/10 border border-emerald-500/20 p-6 flex flex-col sm:flex-row items-start gap-4 overflow-hidden">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 shrink-0">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-emerald-300 text-lg">Integridade de Dados Assegurada</h4>
                  <p className="text-zinc-300 text-sm leading-relaxed">
                    Sua importação foi processada com absoluto sucesso! Todos os registros novos foram criados e não houve duplicatas a descartar.
                  </p>
                </div>
              </div>
            )}

            {/* Sumário das Ações */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 text-center">
                <p className="text-zinc-400 text-xs font-semibold">Novos Registros</p>
                <p className="text-2xl font-extrabold text-emerald-400 mt-1">{totalImported}</p>
              </div>
              <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 text-center">
                <p className="text-zinc-400 text-xs font-semibold">Atualizados</p>
                <p className="text-2xl font-extrabold text-blue-400 mt-1">{totalUpdated}</p>
              </div>
              <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 text-center">
                <p className="text-zinc-400 text-xs font-semibold">Duplicatas Descartadas</p>
                <p className="text-2xl font-extrabold text-amber-400 mt-1">{totalDiscarded}</p>
              </div>
              <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 text-center">
                <p className="text-zinc-400 text-xs font-semibold">Falhas / Erros</p>
                <p className={`text-2xl font-extrabold mt-1 ${totalErrors > 0 ? 'text-red-400' : 'text-zinc-500'}`}>{totalErrors}</p>
              </div>
            </div>

            {/* Relatório Detalhado por Módulo */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-zinc-300">Resumo por Módulo Clínico</h3>

              <div className="divide-y divide-white/5">
                
                {/* Linha 1: Pacientes */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-xl">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-200 text-sm">Pacientes</h4>
                      <p className="text-[11px] text-zinc-500">Histórico clínico de contatos</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-medium">
                      +{importResult.patients.imported} novos
                    </span>
                    <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 font-medium">
                      {importResult.patients.updated} atualizados
                    </span>
                    <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 font-medium">
                      {importResult.patients.discarded} duplicados ignorados
                    </span>
                  </div>
                </div>

                {/* Linha 2: Listas de Espera */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                      <ListTodo className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-200 text-sm">Listas de Espera</h4>
                      <p className="text-[11px] text-zinc-500">Listagem de prioridades e grupos</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-medium">
                      +{importResult.waitlists.imported} novas
                    </span>
                    <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 font-medium">
                      {importResult.waitlists.updated} atualizadas
                    </span>
                    <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 font-medium">
                      {importResult.waitlists.discarded} duplicadas ignoradas
                    </span>
                  </div>
                </div>

                {/* Linha 3: Entradas em Listas */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-200 text-sm">Vínculos de Espera</h4>
                      <p className="text-[11px] text-zinc-500">Posições e prioridades na fila</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-medium">
                      +{importResult.waitlistEntries.imported} vinculados
                    </span>
                    <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 font-medium">
                      {importResult.waitlistEntries.updated} alterados
                    </span>
                    <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 font-medium">
                      {importResult.waitlistEntries.discarded} duplicados ignorados
                    </span>
                  </div>
                </div>

                {/* Linha 4: Agenda Slots */}
                <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-200 text-sm">Slots de Agenda</h4>
                      <p className="text-[11px] text-zinc-500">Horários de consulta planejados</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-medium">
                      +{importResult.agendaSlots.imported} horários
                    </span>
                    <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 font-medium">
                      {importResult.agendaSlots.updated} alterados
                    </span>
                    <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 font-medium">
                      {importResult.agendaSlots.discarded} duplicados ignorados
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
