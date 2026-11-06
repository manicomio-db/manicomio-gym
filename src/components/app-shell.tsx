"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Banknote,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  FileCheck,
  FileText,
  HeartPulse,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  QrCode,
  Receipt,
  ScanLine,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tag,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/(auth)/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Role } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Etiqueta corta para la barra inferior del celular (solo socios). */
  short?: string;
  /** Aparece como pestaña fija en la barra inferior del celular. */
  bottom?: boolean;
};

const NAV: Record<Role, NavItem[]> = {
  socio: [
    {
      href: "/socio",
      label: "Mi cuenta",
      short: "Inicio",
      icon: Home,
      bottom: true,
    },
    {
      href: "/socio/rutina",
      label: "Mi rutina",
      short: "Rutina",
      icon: Dumbbell,
      bottom: true,
    },
    {
      href: "/socio/progreso",
      label: "Mi progreso",
      short: "Progreso",
      icon: TrendingUp,
      bottom: true,
    },
    {
      href: "/socio/qr",
      label: "Mi QR",
      short: "Mi QR",
      icon: QrCode,
      bottom: true,
    },
    { href: "/socio/ficha", label: "Mi ficha", icon: HeartPulse },
    { href: "/socio/pago", label: "Mi pago", icon: Wallet },
    { href: "/socio/mensajes", label: "Mensajes", icon: MessageSquare },
    { href: "/socio/tienda", label: "Tienda", icon: ShoppingBag },
  ],
  staff: [
    { href: "/staff", label: "Panel", icon: LayoutDashboard },
    { href: "/staff/acceso", label: "Control de acceso", icon: ScanLine },
    { href: "/staff/rutinas", label: "Rutinas", icon: ClipboardList },
    { href: "/staff/ventas", label: "Ventas", icon: ShoppingCart },
    { href: "/staff/socios", label: "Socios", icon: Users },
    { href: "/staff/comprobantes", label: "Comprobantes", icon: FileCheck },
    { href: "/staff/mensajes", label: "Mensajes", icon: MessageSquare },
  ],
  dueno: [
    { href: "/dueno", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dueno/ingresos", label: "Ingresos", icon: Banknote },
    { href: "/dueno/informes", label: "Informes", icon: BarChart3 },
    { href: "/dueno/gastos", label: "Gastos", icon: Receipt },
    { href: "/staff/acceso", label: "Control de acceso", icon: ScanLine },
    { href: "/staff/rutinas", label: "Rutinas", icon: ClipboardList },
    { href: "/staff/ventas", label: "Ventas", icon: ShoppingCart },
    { href: "/staff/socios", label: "Socios", icon: Users },
    { href: "/staff/comprobantes", label: "Comprobantes", icon: FileCheck },
    { href: "/staff/mensajes", label: "Mensajes", icon: MessageSquare },
    { href: "/dueno/planes", label: "Planes", icon: Tag },
    { href: "/dueno/clases", label: "Clases", icon: CalendarDays },
    { href: "/dueno/tienda", label: "Tienda", icon: Store },
    { href: "/dueno/staff", label: "Staff", icon: UserCog },
    { href: "/dueno/contenido", label: "Contenido", icon: FileText },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  socio: "Socio",
  staff: "Staff",
  dueno: "Director",
};

/** Las páginas de inicio de cada rol solo se marcan activas en su ruta exacta. */
const ROOTS = new Set(["/socio", "/staff", "/dueno"]);

function isActive(pathname: string, href: string) {
  if (ROOTS.has(href)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  role,
  name,
  badges,
  children,
}: {
  role: Role;
  name: string | null;
  badges?: Record<string, number>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = NAV[role];
  // Solo en celular/tablet: el menú lateral se abre como cajón.
  const [open, setOpen] = useState(false);
  const current = items.find((i) => isActive(pathname, i.href));
  const bottomItems = items.filter((i) => i.bottom);
  const hasBottomBar = bottomItems.length > 0;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      {/* Barra superior en celular */}
      <header className="brand-lines sticky top-0 z-30 flex items-center justify-between gap-2 overflow-clip bg-sidebar px-3 pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] text-sidebar-foreground lg:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/logo.png"
            alt="Manicomio Gym"
            width={1320}
            height={1283}
            className="w-9 shrink-0 rounded-xl ring-1 ring-white/15"
            priority
          />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">
              {current?.label ?? "Manicomio Gym"}
            </p>
            <p className="truncate text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/60">
              {ROLE_LABEL[role]}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          <ThemeToggle className="p-2.5 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="relative rounded-md p-2.5 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
          >
            <Menu className="size-5" />
            {Object.values(badges ?? {}).some((n) => n > 0) && (
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2 ring-sidebar" />
            )}
          </button>
        </div>
        <span aria-hidden className="brand-line absolute inset-x-0 bottom-0" />
      </header>

      {open && (
        <div
          aria-hidden
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "brand-lines fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shrink-0 overflow-clip border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200",
          "lg:sticky lg:top-0 lg:z-auto lg:h-svh lg:w-64 lg:max-w-none lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mb-4 flex shrink-0 items-start justify-between px-2">
            <div>
              <Image
                src="/logo.png"
                alt="Manicomio Gym"
                width={1320}
                height={1283}
                className="w-20 rounded-2xl shadow-lg shadow-primary/30 ring-1 ring-white/15"
                priority
              />
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/60">
                Gym Manager · {ROLE_LABEL[role]}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="rounded-md p-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white lg:hidden"
            >
              <X className="size-5" />
            </button>
          </div>

          <nav className="-mx-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1">
            {items.map((item) => {
              const active = isActive(pathname, item.href);
              const badge = badges?.[item.href] ?? 0;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {badge > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                        active
                          ? "bg-white text-primary"
                          : "bg-primary text-primary-foreground",
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-3 shrink-0 border-t border-sidebar-border pt-3">
            <p className="truncate px-2 text-sm font-medium">
              {name ?? "Usuario"}
            </p>
            <ThemeToggle
              showLabel
              className="mt-2 w-full px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
            />
            <form action={logout}>
              <button
                type="submit"
                className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
              >
                <LogOut className="size-4" />
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main
        className={cn(
          "mx-auto w-full min-w-0 max-w-6xl flex-1 p-3 sm:p-6 lg:p-8",
          hasBottomBar &&
            "pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-8",
        )}
      >
        {children}
      </main>

      {/* Barra inferior del celular: los socios llegan a lo principal con el pulgar */}
      {hasBottomBar && (
        <nav
          aria-label="Navegación principal"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur lg:hidden"
        >
          <span aria-hidden className="brand-line absolute inset-x-0 top-0" />
          <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {bottomItems.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  <span className="max-w-full truncate">
                    {item.short ?? item.label}
                  </span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors",
                !current?.bottom && current
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Menu className="size-5" />
              <span>Más</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
