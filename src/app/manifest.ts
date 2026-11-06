import type { MetadataRoute } from "next";

/** Permite "Agregar a la pantalla de inicio": la app se abre a pantalla completa, como una app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Manicomio Gym",
    short_name: "Manicomio",
    description: "Membresía, rutinas, pagos y acceso al gimnasio.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es",
    background_color: "#161922",
    theme_color: "#161922",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
