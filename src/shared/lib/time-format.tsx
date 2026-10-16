"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Clock } from "lucide-react";
import { syncBackofficeTimeFormatAction } from "./time-format-action";

export type TimeFormat = "12h" | "24h";

const STORAGE_KEY = "yoreservo_bo_time_format";

function getSavedTimeFormat(): TimeFormat {
  if (typeof window === "undefined") return "12h";
  try {
    const fromLs = window.localStorage.getItem(STORAGE_KEY);
    if (fromLs === "12h" || fromLs === "24h") return fromLs;
  } catch {
    // ignore storage errors
  }
  const match = document.cookie.match(new RegExp(`(^| )${STORAGE_KEY}=([^;]+)`));
  if (match) {
    const val = decodeURIComponent(match[2]);
    if (val === "12h" || val === "24h") return val;
  }
  return "12h";
}

function persistTimeFormat(format: TimeFormat): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, format);
  } catch {
    // ignore storage errors
  }
  const expires = new Date(Date.now() + 365 * 864e5).toUTCString();
  document.cookie = `${STORAGE_KEY}=${encodeURIComponent(format)}; path=/; expires=${expires}; SameSite=Lax`;
}

export function formatTime24to12(time24: string): string {
  if (!time24) return "";
  const match = time24.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return time24;
  const rawH = parseInt(match[1], 10);
  const m = match[2];
  if (isNaN(rawH)) return time24;
  const h24 = rawH % 24;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m} ${period}`;
}

export function formatTimeByPref(
  timeStr: string | null | undefined,
  format: TimeFormat = "12h"
): string {
  if (!timeStr) return "";
  if (format === "24h") {
    return timeStr.replace(
      /\b(\d{1,2}):([0-5]\d)\s*(AM|PM|am|pm)\b/g,
      (_full, hh, mm, period) => {
        let h = parseInt(hh, 10);
        const isPm = String(period).toUpperCase() === "PM";
        if (isPm && h < 12) h += 12;
        if (!isPm && h === 12) h = 0;
        return `${String(h).padStart(2, "0")}:${mm}`;
      }
    );
  }
  return timeStr.replace(
    /\b([01]?\d|2[0-4]):([0-5]\d)(?::[0-5]\d)?(?!\s*(?:AM|PM|am|pm))(\s*hrs\b)?/g,
    (_full, hh, mm) => formatTime24to12(`${hh}:${mm}`)
  );
}

export interface TimeFormatContextValue {
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;
  formatTime: (timeStr: string | null | undefined) => string;
}

const TimeFormatContext = createContext<TimeFormatContextValue>({
  timeFormat: "12h",
  setTimeFormat: () => {},
  formatTime: (s) => formatTimeByPref(s, "12h"),
});

export function TimeFormatProvider({ children }: { children: ReactNode }) {
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>("12h");

  useEffect(() => {
    const saved = getSavedTimeFormat();
    setTimeFormatState(saved);
  }, []);

  const setTimeFormat = useCallback((next: TimeFormat) => {
    setTimeFormatState(next);
    persistTimeFormat(next);
    void syncBackofficeTimeFormatAction(next);
  }, []);

  const formatTime = useCallback(
    (timeStr: string | null | undefined) => formatTimeByPref(timeStr, timeFormat),
    [timeFormat]
  );

  return (
    <TimeFormatContext.Provider value={{ timeFormat, setTimeFormat, formatTime }}>
      {children}
    </TimeFormatContext.Provider>
  );
}

export function useTimeFormat(): TimeFormatContextValue {
  return useContext(TimeFormatContext);
}

export interface TimeFormatToggleProps {
  className?: string;
  size?: "xs" | "sm" | "md";
}

export function TimeFormatToggle({
  className = "",
  size = "sm",
}: TimeFormatToggleProps) {
  const { timeFormat, setTimeFormat } = useTimeFormat();
  const btnPadding =
    size === "xs"
      ? "px-1.5 py-0.5 text-[10.5px]"
      : size === "md"
        ? "px-2.5 py-1.5 text-xs"
        : "px-2 py-1 text-[11px]";

  return (
    <div
      className={`inline-flex items-center rounded-xl border border-border bg-surface p-0.5 font-bold shadow-2xs select-none ${className}`}
      role="group"
      aria-label="Formato de hora (AM/PM o 24h)"
    >
      <span className="pl-2 pr-1 text-muted-foreground flex items-center">
        <Clock className="size-3" />
      </span>
      <button
        type="button"
        onClick={() => setTimeFormat("12h")}
        className={`rounded-lg ${btnPadding} transition-all cursor-pointer ${
          timeFormat === "12h"
            ? "bg-accent text-accent-foreground font-extrabold shadow-2xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="Formato 12 horas (AM/PM)"
      >
        AM/PM
      </button>
      <button
        type="button"
        onClick={() => setTimeFormat("24h")}
        className={`rounded-lg ${btnPadding} transition-all cursor-pointer ${
          timeFormat === "24h"
            ? "bg-accent text-accent-foreground font-extrabold shadow-2xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="Formato 24 horas (Militar)"
      >
        24h
      </button>
    </div>
  );
}
