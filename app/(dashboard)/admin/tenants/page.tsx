import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// IMPORTANTE: Importe o novo componente Wrapper aqui
import { GrantTrialDropdownItem } from "@/components/admin/grant-trial-dialog"; 
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default async function AdminTenantsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      isTrial: true,
      stripeCurrentPeriodEnd: true,
      role: true,
    }
  });

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Clientes</h1>
        <Badge variant="outline" className="px-4 py-1">
          {users.length} Clientes Totais
        </Badge>
      </div>

      <div className="rounded-md border bg-white dark:bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Plano Atual</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name || "Sem Nome"}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.plan === "FREE" ? "secondary" : "default"} className={user.plan !== "FREE" ? "bg-amber-500 hover:bg-amber-600" : ""}>
                    {user.plan}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.isTrial && (
                    <Badge variant="outline" className="border-amber-500 text-amber-600">
                      Trial até {user.stripeCurrentPeriodEnd?.toLocaleDateString()}
                    </Badge>
                  )}
                  {!user.isTrial && user.plan !== "FREE" && (
                     <span className="text-sm text-zinc-500">Assinante</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      
                      {/* USAMOS O WRAPPER AQUI: */}
                      <GrantTrialDropdownItem 
                        userId={user.id} 
                        userName={user.name || "Cliente"} 
                      />
                      
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}