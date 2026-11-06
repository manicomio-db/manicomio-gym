"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  showLabel = false,
}: {
  className?: string;
  /** Muestra el texto "Modo oscuro / Modo claro" junto al icono. */
  showLabel?: boolean;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  // Evita diferencias de hidratación: el tema real solo se conoce en el navegador.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const dark = mounted && resolvedTheme === "dark";
  const label = dark ? "Modo claro" : "Modo oscuro";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className={cn("flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors", className)}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {showLabel && <span>{label}</span>}
    </button>
  );
}
