"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logout } from "@/app/(auth)/actions";
import type { Role } from "@/lib/types";

type NavItem = { href: string; label: string };

const NAV: Record<Role, NavItem[]> = {
  socio: [
    { href: "/socio", label: "Mi cuenta" },
    { href: "/socio/rutina", label: "Mi rutina" },
    { href: "/socio/tienda", label: "Tienda" },
  ],
  staff: [
    { href: "/staff", label: "Panel" },
    { href: "/staff/acceso", label: "Control de acceso" },
    { href: "/staff/rutinas", label: "Rutinas" },
    { href: "/staff/ventas", label: "Ventas" },
    { href: "/staff/socios", label: "Socios" },
  ],
  dueno: [
    { href: "/dueno", label: "Dashboard" },
    { href: "/staff/acceso", label: "Control de acceso" },
    { href: "/staff/rutinas", label: "Rutinas" },
    { href: "/staff/ventas", label: "Ventas" },
    { href: "/staff/socios", label: "Socios" },
    { href: "/dueno/planes", label: "Planes" },
    { href: "/dueno/clases", label: "Clases" },
    { href: "/dueno/tienda", label: "Tienda" },
    { href: "/dueno/staff", label: "Staff" },
    { href: "/dueno/contenido", label: "Contenido" },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  socio: "Socio",
  staff: "Staff",
  dueno: "Director",
};

export function AppShell({
  role,
  name,
  children,
}: {
  role: Role;
  name: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = NAV[role];

  return (
    <div className="flex min-h-svh">
      <aside className="flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground">
        <div className="mb-6 px-2">
          <Image
            src="/logo.png"
            alt="Manicomio Gym"
            width={1320}
            height={1283}
            className="w-24"
            priority
          />
          <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Gym Manager · {ROLE_LABEL[role]}
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "border-l-2 px-3 py-2 text-sm font-medium uppercase tracking-wide transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 border-t border-sidebar-border pt-4">
          <p className="truncate px-2 text-sm font-medium">{name ?? "Usuario"}</p>
          <form action={logout}>
            <button
              type="submit"
              className="mt-2 w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
