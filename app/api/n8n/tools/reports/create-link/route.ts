import { NextResponse } from 'next/server';
import { signReportParams } from '@/lib/crypto'; // Importe do arquivo criado acima
import { z } from 'zod';

const ReportRequestSchema = z.object({
  userId: z.string().cuid(),
  type: z.enum(['patients', 'appointments', 'waitlist']), // Tipos suportados
  format: z.enum(['xlsx', 'csv']), // PDF é complexo no serverless sem libs pesadas, vamos focar em Excel/CSV
  filters: z.any().optional(), // Filtros opcionais (data, status, etc)
});

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = ReportRequestSchema.parse(body);

    // Gera um token assinado com os parâmetros do relatório
    const token = signReportParams(data);
    
    // Constrói a URL completa
    // DICA: Use uma variável de ambiente para o domínio base em produção
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const downloadUrl = `${baseUrl}/api/reports/download?t=${token}`;

    return NextResponse.json({ 
      success: true, 
      downloadUrl,
      message: "Link gerado com sucesso."
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao gerar link' }, { status: 400 });
  }
}