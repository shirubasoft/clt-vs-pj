import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});
const BRL0 = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const PCT = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const fmt = {
  brl: (n: number) => BRL.format(isFinite(n) ? n : 0),
  brl0: (n: number) => BRL0.format(isFinite(n) ? n : 0),
  pct: (n: number) => PCT.format(isFinite(n) ? n : 0),
  signed: (n: number) => (n >= 0 ? "+" : "−") + BRL.format(Math.abs(n)),
};
