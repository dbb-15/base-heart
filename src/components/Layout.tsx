import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { NotificacoesBell } from "./NotificacoesBell";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-14 items-center justify-end gap-3 bg-background px-6">
          <NotificacoesBell />
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
