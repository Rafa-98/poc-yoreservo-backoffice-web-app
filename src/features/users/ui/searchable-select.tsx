"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Lock, Search, X } from "lucide-react";

export interface SearchableOption {
  value: string;
  label: string;
  subtitle?: string;
  icon?: string;
}

export interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  dropdownClassName?: string;
  dropdownAlign?: "left" | "right";
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Escribir para buscar...",
  emptyText = "Sin coincidencias",
  disabled = false,
  id,
  className = "",
  dropdownClassName = "",
  dropdownAlign = "left",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.subtitle && o.subtitle.toLowerCase().includes(q)) ||
        o.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      return;
    }
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 20);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className={`relative min-w-0 ${className}`} ref={containerRef}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-border-medium bg-surface px-3 text-left text-xs font-semibold text-foreground shadow-2xs transition-all ${
          disabled
            ? "cursor-not-allowed bg-muted/60 opacity-85"
            : "hover:border-accent/60 hover:bg-muted/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 cursor-pointer"
        }`}
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 text-sm">{selectedOption.icon}</span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        {disabled ? (
          <Lock className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown
            className={`size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 ${
              isOpen ? "rotate-180 text-foreground" : ""
            }`}
          />
        )}
      </button>

      {isOpen && !disabled && (
        <div
          role="listbox"
          className={`absolute top-full z-50 mt-1.5 min-w-[220px] w-full rounded-2xl border border-border-medium bg-surface p-2 shadow-modal animate-in fade-in zoom-in-95 duration-150 ${
            dropdownAlign === "right" ? "right-0" : "left-0"
          } ${dropdownClassName}`}
        >
          {/* Search Input */}
          <div className="relative mb-1.5">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filteredOptions.length > 0) {
                  e.preventDefault();
                  onChange(filteredOptions[0].value);
                  setIsOpen(false);
                }
              }}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-border bg-background py-1.5 pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-accent/15 font-bold text-foreground border border-accent/30"
                        : "text-foreground hover:bg-muted/70"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {opt.icon && (
                        <span className="shrink-0 text-sm">{opt.icon}</span>
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{opt.label}</div>
                        {opt.subtitle && (
                          <div className="truncate text-[10px] text-muted-foreground">
                            {opt.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <Check className="size-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

