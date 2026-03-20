import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function MainLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground whitespace-normal text-left">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-6 bg-white sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1 text-slate-400 hover:text-slate-900 transition-colors" />
              <div className="h-4 w-px bg-slate-200 mx-2" />
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-900 tracking-tight">Licora</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-400 font-medium uppercase tracking-wider">Panel</span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 lg:p-8 max-w-full bg-[#fcfcfc]">
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  );
}
