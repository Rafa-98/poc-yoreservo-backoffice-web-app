"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribeInstallPrompt(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getInstallPromptSnapshot(): BeforeInstallPromptEvent | null {
  return deferredInstallPrompt;
}

function getServerSnapshot(): BeforeInstallPromptEvent | null {
  return null;
}

export async function triggerPwaInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) return false;
  const promptEvent = deferredInstallPrompt;
  await promptEvent.prompt();
  const { outcome } = await promptEvent.userChoice;
  if (outcome === "accepted") {
    deferredInstallPrompt = null;
    notifyListeners();
    return true;
  }
  return false;
}

/**
 * Compact header button ("📲 Instalar App") rendered in `AppHeader` whenever
 * the browser exposes an active `beforeinstallprompt` event.
 */
export function PwaInstallButton() {
  const t = useTranslations("shell");
  const promptEvent = useSyncExternalStore(
    subscribeInstallPrompt,
    getInstallPromptSnapshot,
    getServerSnapshot,
  );

  if (!promptEvent) return null;

  return (
    <button
      type="button"
      onClick={() => void triggerPwaInstall()}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-accent/40 bg-accent/15 px-3 text-xs font-bold text-accent-foreground shadow-xs hover:bg-accent/25 active:scale-95 transition-all"
      title={t("pwaBannerTitle")}
    >
      <Download className="size-3.5 shrink-0" />
      <span className="hidden xl:inline">{t("btnInstallApp")}</span>
    </button>
  );
}

/**
 * Dropdown menu item rendered inside the user profile menu in `AppHeader`
 * when PWA installation is available, keeping the top bar uncluttered.
 */
export function PwaInstallMenuItem({ onAfterClick }: { onAfterClick?: () => void }) {
  const t = useTranslations("shell");
  const promptEvent = useSyncExternalStore(
    subscribeInstallPrompt,
    getInstallPromptSnapshot,
    getServerSnapshot,
  );

  if (!promptEvent) return null;

  return (
    <button
      type="button"
      onClick={() => {
        onAfterClick?.();
        void triggerPwaInstall();
      }}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-muted transition-colors"
    >
      <Download className="size-4 text-muted-foreground shrink-0" />
      <span>{t("btnInstallApp")}</span>
    </button>
  );
}

/**
 * Registers `/sw.js` on mount, captures `beforeinstallprompt`, and shows a
 * subtle dismissible bottom banner when installation is available.
 */
export function PwaRegister() {
  const t = useTranslations("shell");
  const promptEvent = useSyncExternalStore(
    subscribeInstallPrompt,
    getInstallPromptSnapshot,
    getServerSnapshot,
  );
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // Silently ignore registration errors in unsupported environments
        });
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredInstallPrompt = event as BeforeInstallPromptEvent;
      notifyListeners();
    };

    const handleAppInstalled = () => {
      deferredInstallPrompt = null;
      notifyListeners();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (!promptEvent || isDismissed) return null;

  return (
    <aside
      aria-label={t("pwaBannerTitle")}
      className="fixed bottom-4 right-4 left-4 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-accent/35 bg-surface/95 p-3.5 shadow-modal backdrop-blur-md sm:left-auto"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-foreground">
          {t("pwaBannerTitle")}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
          {t("pwaBannerDesc")}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => void triggerPwaInstall()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-accent-foreground shadow-xs hover:brightness-105 active:scale-95 transition-all"
        >
          <span>{t("btnInstallApp")}</span>
        </button>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          aria-label={t("pwaDismiss")}
          title={t("pwaDismiss")}
          className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
    </aside>
  );
}
