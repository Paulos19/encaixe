'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, Upload, Loader2, AlertCircle } from 'lucide-react';
import { importPatientsFromCsv } from '@/app/actions/patient';
import { toast } from 'sonner';

export function ImportPatientsDialog({ waitlistId }: { waitlistId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 }); // Array de arrays

      // Mapeamento simples (assumindo colunas na ordem ou cabeçalho)
      // Vamos tentar identificar pelo cabeçalho
      const headers = (jsonData[0] as string[]).map(h => h.toLowerCase());
      const rows = jsonData.slice(1);

      const formattedData = rows.map((row: any) => {
        // Tenta achar índices ou usa posição fixa: 0=Nome, 1=Telefone, 2=Nascimento, 3=Convenio
        return {
          name: row[headers.indexOf('nome')] || row[0],
          phone: row[headers.indexOf('telefone')] || row[headers.indexOf('celular')] || row[1],
          birthDate: row[headers.indexOf('nascimento')] || row[headers.indexOf('data de nascimento')] || row[2],
          insurance: row[headers.indexOf('convenio')] || row[headers.indexOf('convênio')] || row[3],
          notes: row[headers.indexOf('obs')] || row[4] || ''
        };
      }).filter(r => r.name && r.phone); // Remove linhas vazias

      setData(formattedData);
      setPreview(formattedData.slice(0, 5)); // Mostra os 5 primeiros
    };
    reader.readAsBinaryString(file);
  };

  async function handleImport() {
    setLoading(true);
    const result = await importPatientsFromCsv(waitlistId, data);
    setLoading(false);

    if (result.success) {
      toast.success(`${result.count} pacientes importados com sucesso!`);
      if (result.errors > 0) toast.warning(`${result.errors} erros ignorados.`);
      setOpen(false);
      setData([]);
    } else {
      toast.error("Erro na importação.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSpreadsheet className="h-4 w-4 text-green-600" /> 
          Importar Planilha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importar Pacientes em Massa</DialogTitle>
          <DialogDescription>
            Aceita arquivos .xlsx ou .csv. <br/>
            Colunas esperadas: <strong>Nome, Telefone, Nascimento, Convênio</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!data.length ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-xl h-40 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer relative">
                <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                />
                <Upload className="h-8 w-8 text-zinc-400 mb-2" />
                <p className="text-sm text-zinc-500 font-medium">Clique para selecionar arquivo</p>
                <p className="text-xs text-zinc-400">Excel ou CSV</p>
            </div>
          ) : (
            <div className="space-y-4">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Telefone</TableHead>
                                <TableHead>Convênio</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {preview.map((row, i) => (
                                <TableRow key={i}>
                                    <TableCell>{row.name}</TableCell>
                                    <TableCell>{row.phone}</TableCell>
                                    <TableCell>{row.insurance || '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <p className="text-xs text-zinc-500 text-center">
                    Mostrando 5 de {data.length} registros encontrados.
                </p>
                <Button variant="ghost" size="sm" onClick={() => setData([])} className="w-full text-red-500 hover:text-red-600 hover:bg-red-50">
                    Cancelar e escolher outro
                </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleImport} disabled={loading || data.length === 0} className="w-full sm:w-auto">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Importar {data.length > 0 && `(${data.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}