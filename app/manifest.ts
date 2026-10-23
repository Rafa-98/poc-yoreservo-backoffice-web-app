import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "YoReservo BackOffice — Gestión de Clubes y Tesorería",
    short_name: "YR BackOffice",
    description:
      "Centro de control operativo, agenda multi-cancha y tesorería BCV para aliados y administradores de YoReservo.",
    start_url: "/agenda",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0F140C",
    theme_color: "#1F290F",
    lang: "es-VE",
    dir: "ltr",
    categories: ["business", "finance", "productivity", "sports"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Agenda Multi-Cancha",
        short_name: "Agenda",
        description: "Calendario operativo de canchas, check-in QR y walk-ins",
        url: "/agenda",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Bandeja de Pagos",
        short_name: "Pagos",
        description: "Conciliación de Pago Móvil y verificación de comprobantes",
        url: "/treasury/payments",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Lista de Reservas",
        short_name: "Reservas",
        description: "Historial y auditoría de reservas de clientes y walk-ins",
        url: "/reservations",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
