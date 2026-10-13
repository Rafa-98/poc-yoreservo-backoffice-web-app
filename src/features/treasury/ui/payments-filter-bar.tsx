"use client";

import { useTranslations } from "next-intl";

interface PaymentsFilterBarProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  bankFilter: string;
  onBankChange: (bank: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: {
    all: number;
    pending: number;
    verified: number;
    rejected: number;
  };
}

export function PaymentsFilterBar({
  statusFilter,
  onStatusChange,
  bankFilter,
  onBankChange,
  searchQuery,
  onSearchChange,
  counts,
}: PaymentsFilterBarProps) {
  const t = useTranslations("treasury.inbox.filters");

  return (
    <section
      style={{
        padding: "0 20px 16px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
      }}
    >
      {/* STATUS CHIPS */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className={`filter-chip-btn ${statusFilter === "ALL" ? "active" : ""}`}
          onClick={() => onStatusChange("ALL")}
          style={{
            padding: "6px 14px",
            fontSize: 12.5,
            fontWeight: 600,
            borderRadius: 10,
            border: "1px solid var(--border-subtle)",
            backgroundColor: statusFilter === "ALL" ? "var(--text-main)" : "var(--bg-surface)",
            color: statusFilter === "ALL" ? "var(--bg-app)" : "var(--text-muted)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {t("all")} ({counts.all})
        </button>

        <button
          type="button"
          className={`filter-chip-btn ${statusFilter === "PENDING" ? "active" : ""}`}
          onClick={() => onStatusChange("PENDING")}
          style={{
            padding: "6px 14px",
            fontSize: 12.5,
            fontWeight: 600,
            borderRadius: 10,
            border: "1px solid var(--border-subtle)",
            backgroundColor: statusFilter === "PENDING" ? "var(--text-main)" : "var(--bg-surface)",
            color: statusFilter === "PENDING" ? "var(--bg-app)" : "var(--text-muted)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s ease",
          }}
        >
          <span>⏳</span> {t("pending")} ({counts.pending})
        </button>

        <button
          type="button"
          className={`filter-chip-btn ${statusFilter === "VERIFIED" ? "active" : ""}`}
          onClick={() => onStatusChange("VERIFIED")}
          style={{
            padding: "6px 14px",
            fontSize: 12.5,
            fontWeight: 600,
            borderRadius: 10,
            border: "1px solid var(--border-subtle)",
            backgroundColor: statusFilter === "VERIFIED" ? "var(--text-main)" : "var(--bg-surface)",
            color: statusFilter === "VERIFIED" ? "var(--bg-app)" : "var(--text-muted)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s ease",
          }}
        >
          <span>✅</span> {t("verified")} ({counts.verified})
        </button>

        <button
          type="button"
          className={`filter-chip-btn ${statusFilter === "REJECTED" ? "active" : ""}`}
          onClick={() => onStatusChange("REJECTED")}
          style={{
            padding: "6px 14px",
            fontSize: 12.5,
            fontWeight: 600,
            borderRadius: 10,
            border: "1px solid var(--border-subtle)",
            backgroundColor: statusFilter === "REJECTED" ? "var(--text-main)" : "var(--bg-surface)",
            color: statusFilter === "REJECTED" ? "var(--bg-app)" : "var(--text-muted)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s ease",
          }}
        >
          <span>❌</span> {t("rejected")} ({counts.rejected})
        </button>
      </div>

      {/* SEARCH & BANK SELECTOR */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <select
          id="bank-filter-select"
          className="input-field"
          style={{
            width: "auto",
            padding: "8px 12px",
            fontSize: 13,
            borderRadius: 10,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-main)",
            cursor: "pointer",
          }}
          value={bankFilter}
          onChange={(e) => onBankChange(e.target.value)}
        >
          <option value="ALL">{t("allBanks")}</option>
          <option value="0134">0134 — Banesco</option>
          <option value="0105">0105 — Mercantil</option>
          <option value="0102">0102 — Banco de Venezuela</option>
          <option value="0172">0172 — Bancamiga</option>
        </select>

        <div style={{ width: 260, position: "relative" }}>
          <input
            id="payments-search-input"
            type="text"
            className="input-field"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 14px",
              fontSize: 13,
              borderRadius: 10,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-main)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
