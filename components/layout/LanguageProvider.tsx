"use client";
import { LanguageProvider as LP } from "@/lib/i18n";
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return <LP>{children}</LP>;
}
