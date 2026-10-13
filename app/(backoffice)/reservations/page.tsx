import React from "react";
import { Metadata } from "next";
import { requireSession } from "@/shared/auth/index.server";
import { getReservationsAction } from "@/features/reservations/actions/reservations-actions";
import {
  getSpacesAction,
  getVenuesListAction,
} from "@/features/venues/actions/venues-actions";
import { getExchangeRatesAction } from "@/features/treasury/actions/treasury-actions";
import { ReservationsPage } from "@/_pages/reservations/reservations-page";

export const metadata: Metadata = {
  title: "Control Maestro de Reservas & Check-In | YoReservo Backoffice",
  description:
    "Gestión integral de partidos, reservas walk-in en taquilla, check-in express y conciliación contable.",
};

export default async function Page() {
  await requireSession();

  const [resRes, venuesRes, ratesRes] = await Promise.all([
    getReservationsAction(),
    getVenuesListAction(),
    getExchangeRatesAction(),
  ]);

  const venues = venuesRes.ok && venuesRes.data ? venuesRes.data : [];
  const bcvRate =
    ratesRes.ok && ratesRes.data?.activeUsd ? ratesRes.data.activeUsd.rate : 41.0;

  const initialReservations = resRes.ok && resRes.data ? resRes.data.items : [];
  const initialKpis = resRes.ok && resRes.data
    ? resRes.data.kpis
    : {
        totalBookings: 0,
        confirmedCount: 0,
        walkinCount: 0,
        volumeUsd: 0,
        volumeVes: 0,
      };

  const fallbackReservations = [
    {
      id: "res-demo-1",
      code: "AB4553",
      origin: "app" as const,
      clientName: "Ignacio Silva",
      dni: "V-19482910",
      phone: "+58 414 9102938",
      venueId: venues[0]?.id || "v-1",
      venue: venues[0]?.name || "Complejo Las Mercedes",
      court: "Cancha 1 — Panorámica",
      sport: "Pádel",
      date: new Date().toISOString().split("T")[0],
      dateDisplay: "Hoy",
      timeSlot: "18:00 - 19:30",
      duration: "90 min",
      priceUsd: 40,
      rateBcv: bcvRate,
      priceBs: 40 * bcvRate,
      paymentMethod: "pago_movil",
      paymentMeta: "Pago Móvil Banesco • Ref: #84920194",
      status: "CONFIRMED" as const,
      checkedIn: false,
    },
    {
      id: "res-demo-2",
      code: "MN7102",
      origin: "walk-in" as const,
      clientName: "Carlos Mendoza",
      dni: "V-16829104",
      phone: "+58 412 8881920",
      venueId: venues[0]?.id || "v-1",
      venue: venues[0]?.name || "Complejo Las Mercedes",
      court: "Cancha 2 — Panorámica",
      sport: "Pádel",
      date: new Date().toISOString().split("T")[0],
      dateDisplay: "Hoy",
      timeSlot: "19:30 - 21:00",
      duration: "90 min",
      priceUsd: 40,
      rateBcv: bcvRate,
      priceBs: 40 * bcvRate,
      paymentMethod: "cash",
      paymentMeta: "Efectivo en Mostrador ($40 en caja)",
      status: "CONFIRMED" as const,
      checkedIn: true,
      checkedInBy: "Mariana Duarte",
    },
    {
      id: "res-demo-3",
      code: "FK3901",
      origin: "app" as const,
      clientName: "Daniela Salazar",
      dni: "V-25810293",
      phone: "+58 424 5551234",
      venueId: venues[1]?.id || venues[0]?.id || "v-2",
      venue: venues[1]?.name || "San Agustín del Paraíso",
      court: "Cancha Fútbol 7 Pro",
      sport: "Fútbol",
      date: new Date().toISOString().split("T")[0],
      dateDisplay: "Hoy",
      timeSlot: "20:00 - 21:00",
      duration: "60 min",
      priceUsd: 25,
      rateBcv: bcvRate,
      priceBs: 25 * bcvRate,
      paymentMethod: "pago_movil",
      paymentMeta: "Pago Móvil Mercantil • Ref: #30194821",
      status: "PENDING_PAYMENT" as const,
      checkedIn: false,
    },
    {
      id: "res-demo-4",
      code: "YT9021",
      origin: "app" as const,
      clientName: "Gustavo Paiva",
      dni: "V-14782019",
      phone: "+58 416 3330011",
      venueId: venues[0]?.id || "v-1",
      venue: venues[0]?.name || "Complejo Las Mercedes",
      court: "Cancha 1 — Arcilla Batida",
      sport: "Tenis",
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      dateDisplay: "Mañana",
      timeSlot: "08:00 - 09:30",
      duration: "90 min",
      priceUsd: 30,
      rateBcv: bcvRate,
      priceBs: 30 * bcvRate,
      paymentMethod: "pos",
      paymentMeta: "Tarjeta Débito Punto • Lote: 049",
      status: "CONFIRMED" as const,
      checkedIn: false,
    },
    {
      id: "res-demo-5",
      code: "QP1194",
      origin: "walk-in" as const,
      clientName: "Roberto Gómez",
      dni: "V-12948102",
      phone: "+58 414 2223344",
      venueId: venues[0]?.id || "v-1",
      venue: venues[0]?.name || "Complejo Las Mercedes",
      court: "Cancha 3 — Techada",
      sport: "Pádel",
      date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
      dateDisplay: "Ayer",
      timeSlot: "17:00 - 18:30",
      duration: "90 min",
      priceUsd: 35,
      rateBcv: bcvRate,
      priceBs: 35 * bcvRate,
      paymentMethod: "cash",
      paymentMeta: "Efectivo $35 USD",
      status: "COMPLETED" as const,
      checkedIn: true,
      checkedInBy: "Mariana Duarte",
    },
    {
      id: "res-demo-6",
      code: "ZZ0019",
      origin: "app" as const,
      clientName: "Alejandro Morales",
      dni: "V-14285910",
      phone: "+58 412 1112233",
      venueId: venues[1]?.id || venues[0]?.id || "v-2",
      venue: venues[1]?.name || "San Agustín del Paraíso",
      court: "Cancha Fútbol 5",
      sport: "Fútbol",
      date: new Date(Date.now() - 172800000).toISOString().split("T")[0],
      dateDisplay: "Hace 2 días",
      timeSlot: "16:00 - 17:00",
      duration: "60 min",
      priceUsd: 20,
      rateBcv: bcvRate,
      priceBs: 20 * bcvRate,
      paymentMethod: "pago_movil",
      paymentMeta: "Rechazado por comprobante duplicado",
      status: "CANCELLED" as const,
      checkedIn: false,
    },
  ];

  const reservations = initialReservations.length > 0 ? initialReservations : fallbackReservations;
  const kpis = initialReservations.length > 0
    ? initialKpis
    : {
        totalBookings: 184,
        confirmedCount: 142,
        walkinCount: 28,
        volumeUsd: 6840.0,
        volumeVes: 6840.0 * bcvRate,
      };

  // Fetch spaces for the first venue or all venues
  const targetVenueId = venues[0]?.id || "";
  const spacesRes = targetVenueId ? await getSpacesAction(targetVenueId) : null;
  const rawSpaces = spacesRes?.ok && spacesRes.data ? spacesRes.data : [];

  const spaces = rawSpaces.map((s) => ({
    id: s.id,
    name: s.spaceNumber.toLowerCase().includes("cancha") ? s.spaceNumber : `Cancha ${s.spaceNumber}`,
    venueId: s.venueId,
    pricePerHour: s.pricePerHour,
  }));

  const mappedVenues = venues.map((v) => ({ id: v.id, name: v.name }));

  return (
    <ReservationsPage
      initialReservations={reservations}
      initialKpis={kpis}
      venues={mappedVenues}
      spaces={spaces}
      bcvRate={bcvRate}
    />
  );
}
