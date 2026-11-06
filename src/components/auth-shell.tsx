import type { ReactNode } from "react";
import Image from "next/image";

/**
 * Marco de las pantallas de acceso. En pantallas grandes: el póster del gimnasio a la izquierda
 * y el formulario en un panel de cristal a la derecha. En celular: solo el fondo de marca
 * (grafito con líneas y brillo naranja) para que cargue al instante y el formulario se lea bien.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="brand-bg flex min-h-svh">
      <div aria-hidden className="relative hidden overflow-hidden lg:m-6 lg:mr-0 lg:block lg:flex-[1.2] lg:rounded-3xl">
        <Image
          src="/landing-bg.png"
          alt=""
          fill
          sizes="(min-width: 1024px) 55vw, 1px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_55%,oklch(0.14_0.018_265/55%)_100%),linear-gradient(0deg,oklch(0.14_0.018_265/35%),transparent_30%)]" />
      </div>
      <div className="relative flex flex-1 items-center justify-center p-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:m-6 lg:rounded-3xl lg:border lg:border-white/10 lg:bg-white/[0.04] lg:p-10 lg:backdrop-blur-xl">
        <div className="flex w-full max-w-sm flex-col items-center gap-6">{children}</div>
      </div>
    </div>
  );
}
