import type { ReactNode } from "react";

/** Encabezado de página con el estilo de marca: grafito, líneas naranja y plata. */
export function PageHeader({
  title,
  subtitle,
  leading,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Contenido a la izquierda del título (por ejemplo la foto del socio). */
  leading?: ReactNode;
  /** Contenido a la derecha (por ejemplo etiquetas o botones). */
  children?: ReactNode;
}) {
  return (
    <header className="brand-hero px-4 py-4 sm:px-7 sm:py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          {leading}
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-white/70 first-letter:uppercase">{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </header>
  );
}
