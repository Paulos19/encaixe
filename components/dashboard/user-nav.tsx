"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { LogOut, Settings, User, ShieldCheck } from "lucide-react";

interface UserNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export function UserNav({ user }: UserNavProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-zinc-800 focus:ring-2 focus:ring-amber-500/20">
          <Avatar className="h-10 w-10 border border-zinc-800 transition-all hover:border-amber-500/50">
            <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
            <AvatarFallback className="bg-zinc-900 font-bold text-amber-500">
              {user?.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {/* Status Indicator - Online */}
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-black" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-zinc-950 border-zinc-800 text-zinc-200" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-white">{user?.name}</p>
            <p className="text-xs leading-none text-zinc-500">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuGroup>
          <DropdownMenuItem className="focus:bg-zinc-900 focus:text-amber-500 cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="focus:bg-zinc-900 focus:text-amber-500 cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        {user.role === 'ADMIN' && (
           <>
             <DropdownMenuSeparator className="bg-zinc-800" />
             <DropdownMenuItem className="focus:bg-zinc-900 focus:text-amber-500 cursor-pointer">
               <ShieldCheck className="mr-2 h-4 w-4 text-amber-500" />
               <span>Painel Admin</span>
             </DropdownMenuItem>
           </>
        )}

        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem 
          className="text-red-400 focus:bg-red-950/30 focus:text-red-500 cursor-pointer"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}