/** Canonical fallback BCV exchange rates when the backend rate service is unreachable. */
export const DEFAULT_BCV_USD_RATE = 41.0;
export const DEFAULT_BCV_EUR_RATE = 44.28;

const CENTS_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats a USD amount with 2 decimals: `$30.00`, `$3.60`, `$63.60`.
 * The separator is the same in every language so the price never changes shape
 * when the user switches language.
 *
 * Display only: money math (fees, rates, settlements) is done by the backend.
 */
export function formatUsd(amount: number): string {
  return `$${CENTS_FORMATTER.format(amount)}`;
}

/** Always two decimals (`$1,250.00`): ledgers, settlements and reports. */
export function formatUsdFixed(amount: number): string {
  return `$${CENTS_FORMATTER.format(amount)}`;
}

const BS_FORMATTER = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats a bolívar amount: `Bs 55.691,37`. Always two decimals, always the
 * Venezuelan separators, in every language, so the amount never changes shape
 * when the user switches it.
 */
export function formatBs(amount: number): string {
  return `Bs ${BS_FORMATTER.format(amount)}`;
}

/** USD equivalent label of the payment screens: `USD 63,60`. */
export function formatUsdEquivalent(amount: number): string {
  return `USD ${BS_FORMATTER.format(amount)}`;
}

/**
 * Universal multi-currency formatter (always 2 decimals):
 * supports USD ($), EUR (€), and VES (Bs).
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = "USD",
): string {
  const code = (currencyCode || "USD").toUpperCase();
  if (code === "EUR") {
    return `€${CENTS_FORMATTER.format(amount)}`;
  }
  if (code === "VES") {
    return formatBs(amount);
  }
  return formatUsd(amount);
}
