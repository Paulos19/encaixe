import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getWeekSlots } from "@/app/actions/agenda";
import { CalendarGrid } from "@/components/agenda/calendar-grid";

export default async function AgendaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Carrega slots da semana atual inicialmente
  const slots = await getWeekSlots(new Date());

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Agenda de Disponibilidade
        </h1>
        <p className="text-muted-foreground">
          Clique nos horários vazios para criar janelas de encaixe que o robô poderá oferecer.
        </p>
      </div>

      <div className="flex-1 min-h-0">
         <CalendarGrid initialSlots={slots} />
      </div>
    </div>
  );
}