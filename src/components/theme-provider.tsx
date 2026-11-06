"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Sigue el tema del dispositivo y recuerda la elección manual de cada persona. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
