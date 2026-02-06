import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyReportParams } from '@/lib/crypto';
import * as XLSX from 'xlsx';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('t');

  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const params = verifyReportParams(token);
  if (!params) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 403 });

  const { userId, type, format } = params;

  try {
    let data: any[] = [];
    let filename = `relatorio-${type}-${Date.now()}`;

    // 1. Busca os Dados
    if (type === 'patients') {
      const patients = await prisma.patient.findMany({
        where: { managerId: userId },
        select: { name: true, phone: true, email: true, insurance: true, birthDate: true, notes: true, createdAt: true }
      });
      data = patients.map(p => ({
        ...p,
        birthDate: p.birthDate ? p.birthDate.toLocaleDateString('pt-BR') : '',
        createdAt: p.createdAt.toLocaleDateString('pt-BR')
      }));
    } 
    else if (type === 'appointments') {
      const slots = await prisma.agendaSlot.findMany({
        where: { userId, isBooked: true },
        include: { patient: true },
        orderBy: { startTime: 'desc' }
      });
      data = slots.map(s => ({
        Data: s.startTime.toLocaleDateString('pt-BR'),
        Hora: s.startTime.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
        Paciente: s.patient?.name || 'Anônimo',
        Telefone: s.patient?.phone || '',
        Convenio: s.patient?.insurance || ''
      }));
    }
    else if (type === 'waitlist') {
       // Lógica para lista de espera...
       const entries = await prisma.waitlistEntry.findMany({
         where: { waitlist: { ownerId: userId } },
         include: { patient: true, waitlist: true }
       });
       data = entries.map(e => ({
         Lista: e.waitlist.name,
         Paciente: e.patient.name,
         Status: e.status,
         Prioridade: e.priority,
         EntrouEm: e.addedAt.toLocaleDateString('pt-BR')
       }));
    }

    // 2. Gera o Arquivo
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
    
    // Gera Buffer
    const buf = XLSX.write(workbook, { type: "buffer", bookType: format === 'csv' ? 'csv' : 'xlsx' });

    // 3. Retorna o Download
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}.${format}"`,
        'Content-Type': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao gerar arquivo' }, { status: 500 });
  }
}