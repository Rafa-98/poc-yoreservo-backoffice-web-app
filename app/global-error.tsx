"use client";

import "@/_app/styles/globals.css";
import { MESSAGES, type AppMessages } from "@/shared/i18n/messages";
import { DEFAULT_LOCALE } from "@/shared/i18n/config";
import { themeInitScript } from "@/shared/lib/theme";

/**
 * Last-resort boundary: it replaces the root layout, so there is no i18n
 * provider here. We pick the language from the browser and read the same
 * `/locales` JSON files directly.
 */
function pickMessages(): { lang: string; messages: AppMessages } {
  const prefersEnglish =
    typeof navigator !== "undefined" && navigator.language.startsWith("en");
  const lang = prefersEnglish ? "en" : DEFAULT_LOCALE;
  return { lang, messages: MESSAGES[lang] };
}

export default function GlobalError({ retry }: { retry: () => void }) {
  const { lang, messages } = pickMessages();

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <main className="grid min-h-dvh place-items-center px-6 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="text-3xl font-bold">{messages.status.error.title}</h1>
            <p className="text-muted-foreground">
              {messages.status.error.description}
            </p>
            <button
              type="button"
              onClick={() => retry()}
              className="h-12 rounded-xl bg-accent px-6 font-semibold text-accent-foreground"
            >
              {messages.common.actions.retry}
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}