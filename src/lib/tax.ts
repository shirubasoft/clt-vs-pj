/**
 * Brazilian CLT vs PJ calculator — 2026 tables.
 *
 * Sources audited April 2026:
 *  - INSS 2026: Portaria MPS — teto R$ 8.475,55, salário mínimo R$ 1.621
 *  - IRRF 2026: tabela progressiva + Lei 15.270/2025 (redutor de isenção até R$ 5k)
 *  - Simples Nacional: LC 123/2006 — alíquotas/parcela a deduzir Anexos III e V
 *  - Exportação de serviços: LC 116/2003 (ISS isento), LC 123/2006 art. 18 §14 (DAS sem ISS)
 *
 * Disclaimer: valores arredondados ao centavo. ISS municipal varia por cidade.
 */

// ──────────────────────────────────────────────────────────────────────────
// Tables — 2026
// ──────────────────────────────────────────────────────────────────────────

export const INSS_BRACKETS_2026 = [
  { up: 1621.0, rate: 0.075 },
  { up: 2902.84, rate: 0.09 },
  { up: 4354.27, rate: 0.12 },
  { up: 8475.55, rate: 0.14 },
];
export const INSS_CEILING_2026 = 8475.55;

// Classic progressive IRRF table (2026)
export const IRRF_BRACKETS_2026 = [
  { up: 2428.8, rate: 0, deduct: 0 },
  { up: 2826.65, rate: 0.075, deduct: 182.16 },
  { up: 3751.05, rate: 0.15, deduct: 394.16 },
  { up: 4664.68, rate: 0.225, deduct: 675.49 },
  { up: Infinity, rate: 0.275, deduct: 908.73 },
];

// Desconto simplificado mensal (2026)
export const IRRF_SIMPLIFIED_DEDUCTION = 607.2;

// Lei 15.270/2025 — redutor mensal a partir de 2026
// Renda ≤ 5.000 → imposto = 0 (redutor cobre)
// Entre 5.000,01 e 7.350 → redutor = 978.62 − 0.133145 × renda_bruta
// Acima de 7.350 → sem redutor
export const REDUTOR_LIMIT_FULL = 5000.0;
export const REDUTOR_LIMIT_PARTIAL = 7350.0;
export const REDUTOR_FORMULA = { a: 978.62, b: 0.133145 };

// PLR — tabela anual exclusiva (unchanged 2025/2026)
export const PLR_BRACKETS_2026 = [
  { up: 7640.8, rate: 0, deduct: 0 },
  { up: 9922.28, rate: 0.075, deduct: 573.06 },
  { up: 13167.0, rate: 0.15, deduct: 1317.22 },
  { up: 16380.38, rate: 0.225, deduct: 2304.75 },
  { up: Infinity, rate: 0.275, deduct: 3123.78 },
];

// Simples Anexo III — 2026
export const SIMPLES_ANEXO_III = [
  { upAnnual: 180_000, rate: 0.06, deduct: 0 },
  { upAnnual: 360_000, rate: 0.112, deduct: 9_360 },
  { upAnnual: 720_000, rate: 0.135, deduct: 17_640 },
  { upAnnual: 1_800_000, rate: 0.16, deduct: 35_640 },
  { upAnnual: 3_600_000, rate: 0.21, deduct: 125_640 },
  { upAnnual: 4_800_000, rate: 0.33, deduct: 648_000 },
];

// Simples Anexo V — 2026
export const SIMPLES_ANEXO_V = [
  { upAnnual: 180_000, rate: 0.155, deduct: 0 },
  { upAnnual: 360_000, rate: 0.18, deduct: 4_500 },
  { upAnnual: 720_000, rate: 0.195, deduct: 9_900 },
  { upAnnual: 1_800_000, rate: 0.205, deduct: 17_100 },
  { upAnnual: 3_600_000, rate: 0.23, deduct: 62_100 },
  { upAnnual: 4_800_000, rate: 0.305, deduct: 540_000 },
];

// Anexo III — share of each tax within the alíquota (Resolução CGSN 140/2018 Anexo V).
// Relevant for export-of-services: ISS + PIS/COFINS are removed from DAS on exports.
// These are per-bracket values for Anexo III.
export const ANEXO_III_REPARTICAO = [
  { iss: 0.335, pis: 0.0278, cofins: 0.1282 }, // 1ª faixa
  { iss: 0.325, pis: 0.0287, cofins: 0.1305 },
  { iss: 0.325, pis: 0.0287, cofins: 0.1305 },
  { iss: 0.325, pis: 0.0287, cofins: 0.1305 },
  { iss: 0.325, pis: 0.0287, cofins: 0.1305 },
  { iss: 0.0,   pis: 0.0287, cofins: 0.1305 }, // 6ª faixa — ISS fora do DAS
];

// IOF on inbound FX (recebimento de exportação de serviços)
export const IOF_EXPORT_RATE = 0.0038;

// Seguro-desemprego (valor médio 2026 — simplificado)
export const SEGURO_DESEMPREGO_MAX = 2424.11;

// ──────────────────────────────────────────────────────────────────────────
// Primitives
// ──────────────────────────────────────────────────────────────────────────

export function calcINSS(salary: number): number {
  if (salary <= 0) return 0;
  const base = Math.min(salary, INSS_CEILING_2026);
  let total = 0;
  let prev = 0;
  for (const b of INSS_BRACKETS_2026) {
    const top = Math.min(base, b.up);
    if (top > prev) total += (top - prev) * b.rate;
    prev = top;
    if (base <= b.up) break;
  }
  return total;
}

/**
 * Progressive IRRF with the 2026 redutor (Lei 15.270/2025).
 * `grossForRedutor` is the full gross income used to evaluate the redutor cap
 * (the redutor is evaluated on "rendimentos tributáveis" — pre-INSS).
 */
export function calcIRRF(
  taxableBase: number,
  dependents = 0,
  grossForRedutor = 0,
  useSimplified = true
): number {
  if (taxableBase <= 0) return 0;
  const DEP = 189.59; // 2026 per-dependent deduction
  let base = taxableBase - dependents * DEP;
  if (useSimplified) base -= IRRF_SIMPLIFIED_DEDUCTION;
  if (base <= 0) return 0;

  const br = IRRF_BRACKETS_2026.find((b) => base <= b.up)!;
  const rawTax = Math.max(0, base * br.rate - br.deduct);

  // Redutor — zerar IR até 5k, reduzir gradualmente até 7.350
  const g = grossForRedutor || taxableBase;
  let redutor = 0;
  if (g <= REDUTOR_LIMIT_FULL) {
    redutor = rawTax; // zera
  } else if (g <= REDUTOR_LIMIT_PARTIAL) {
    redutor = Math.max(0, REDUTOR_FORMULA.a - REDUTOR_FORMULA.b * g);
  }
  return Math.max(0, rawTax - redutor);
}

export function calcPLRTax(annualPLR: number): number {
  if (annualPLR <= 0) return 0;
  const br = PLR_BRACKETS_2026.find((b) => annualPLR <= b.up)!;
  return Math.max(0, annualPLR * br.rate - br.deduct);
}

function simplesBracketIndex(annualRevenue: number, table: typeof SIMPLES_ANEXO_III): number {
  for (let i = 0; i < table.length; i++) {
    if (annualRevenue <= table[i].upAnnual) return i;
  }
  return table.length - 1;
}

function simplesRate(annualRevenue: number, table: typeof SIMPLES_ANEXO_III): number {
  if (annualRevenue <= 0) return 0;
  const br = table[simplesBracketIndex(annualRevenue, table)];
  return Math.max(0, (annualRevenue * br.rate - br.deduct) / annualRevenue);
}

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────

export type Regime = "simples_iii" | "simples_v" | "lucro_presumido";
export type Currency = "BRL" | "USD";

export interface CLTInput {
  grossMonthly: number;
  plrAnnual: number;
  dependents: number;
  vaVr: number;
  vtMonthly: number;
  healthInsuranceCompany: number;
  otherBenefits: number;
}

export interface PJInput {
  /** Moeda do contrato */
  currency: Currency;
  /** Se currency = BRL, valor mensal em BRL. Se USD, valor mensal em USD. */
  invoiceMonthly: number;
  /** Câmbio USD→BRL usado para conversão (default: cotação comercial) */
  exchangeRate: number;
  /** Tratar como exportação de serviços? (padrão = true quando USD) */
  isExport: boolean;
  regime: Regime;
  proLaboreMonthly: number;
  accountantMonthly: number;
  issRate: number;
  healthOutOfPocket: number;
  benefitsOutOfPocket: number;
}

export interface SafetyInput {
  emergencyMonths: number;
  monthlyExpenses: number;
  unemploymentProbability: number;
}

// ──────────────────────────────────────────────────────────────────────────
// CLT
// ──────────────────────────────────────────────────────────────────────────

export interface CLTBreakdown {
  grossAnnual: number;
  inssAnnual: number;
  irrfAnnual: number;
  fgtsAnnual: number;
  thirteenthNet: number;
  vacationNet: number;
  plrNet: number;
  benefitsAnnual: number;
  netCashAnnual: number;
  netWithBenefitsAnnual: number;
  effectiveTaxRate: number;
  monthlyNet: number;
}

export function computeCLT(i: CLTInput): CLTBreakdown {
  const { grossMonthly, plrAnnual, dependents, vaVr, vtMonthly, healthInsuranceCompany, otherBenefits } = i;

  const monthlyINSS = calcINSS(grossMonthly);
  const monthlyIRBase = grossMonthly - monthlyINSS;
  const monthlyIRRF = calcIRRF(monthlyIRBase, dependents, grossMonthly);
  const vtDeduction = Math.min(grossMonthly * 0.06, vtMonthly);
  const monthlyNet = grossMonthly - monthlyINSS - monthlyIRRF - vtDeduction;

  const thirteenthINSS = calcINSS(grossMonthly);
  const thirteenthIRRF = calcIRRF(grossMonthly - thirteenthINSS, dependents, grossMonthly);
  const thirteenthNet = grossMonthly - thirteenthINSS - thirteenthIRRF;

  const vacationGross = grossMonthly + grossMonthly / 3;
  const vacationINSS = calcINSS(vacationGross);
  const vacationIRRF = calcIRRF(vacationGross - vacationINSS, dependents, vacationGross);
  const vacationNet = vacationGross - vacationINSS - vacationIRRF;
  const vacationBonusNet = vacationNet - (grossMonthly - monthlyINSS - monthlyIRRF);

  const plrTax = calcPLRTax(plrAnnual);
  const plrNet = plrAnnual - plrTax;

  const fgtsMonthly = grossMonthly * 0.08;
  const fgtsThirteenth = grossMonthly * 0.08;
  const fgtsAnnual = fgtsMonthly * 12 + fgtsThirteenth;

  const grossAnnual = grossMonthly * 13 + vacationGross + plrAnnual;
  const inssAnnual = monthlyINSS * 12 + thirteenthINSS + vacationINSS;
  const irrfAnnual = monthlyIRRF * 12 + thirteenthIRRF + vacationIRRF + plrTax;

  const benefitsMonthly = vaVr + healthInsuranceCompany + otherBenefits;
  const benefitsAnnual = benefitsMonthly * 12;

  const netCashAnnual = monthlyNet * 12 + thirteenthNet + vacationBonusNet + plrNet;
  const netWithBenefitsAnnual = netCashAnnual + benefitsAnnual + fgtsAnnual;
  const effectiveTaxRate = grossAnnual > 0 ? (inssAnnual + irrfAnnual) / grossAnnual : 0;

  return {
    grossAnnual, inssAnnual, irrfAnnual, fgtsAnnual,
    thirteenthNet, vacationNet: vacationBonusNet, plrNet,
    benefitsAnnual, netCashAnnual, netWithBenefitsAnnual,
    effectiveTaxRate, monthlyNet,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// PJ
// ──────────────────────────────────────────────────────────────────────────

export interface PJBreakdown {
  /** Faturamento bruto anual em BRL (após conversão de câmbio, se aplicável) */
  grossAnnual: number;
  /** Faturamento bruto anual em moeda original (para exibição) */
  grossAnnualOriginal: number;
  /** IOF sobre câmbio (só aplica se USD) */
  iofAnnual: number;
  /** DAS (Simples Nacional) */
  dasAnnual: number;
  /** Economia anual estimada pela isenção de ISS em exportação */
  exportTaxSaving: number;
  /** Lucro Presumido: total de tributos */
  lucroPresumidoTaxAnnual: number;
  proLaboreINSSAnnual: number;
  proLaboreIRRFAnnual: number;
  accountantAnnual: number;
  issAnnual: number;
  outOfPocketBenefitsAnnual: number;
  netCashAnnual: number;
  effectiveTaxRate: number;
  effectiveRegimeRate: number;
  regimeLabel: string;
  monthlyNet: number;
  currency: Currency;
  exchangeRate: number;
  isExport: boolean;
}

export function computePJ(i: PJInput): PJBreakdown {
  const {
    currency, invoiceMonthly, exchangeRate, isExport,
    regime, proLaboreMonthly, accountantMonthly, issRate,
    healthOutOfPocket, benefitsOutOfPocket,
  } = i;

  // Convert invoice to BRL
  const monthlyBRL = currency === "USD" ? invoiceMonthly * exchangeRate : invoiceMonthly;
  const grossAnnual = monthlyBRL * 12;
  const grossAnnualOriginal = invoiceMonthly * 12;

  // IOF on inbound FX (only when receiving in USD)
  const iofAnnual = currency === "USD" ? grossAnnual * IOF_EXPORT_RATE : 0;

  // Pro-labore taxation
  const plINSSMonthly = Math.min(proLaboreMonthly, INSS_CEILING_2026) * 0.11;
  const plIRRFMonthly = calcIRRF(proLaboreMonthly - plINSSMonthly, 0, proLaboreMonthly);
  const proLaboreINSSAnnual = plINSSMonthly * 12;
  const proLaboreIRRFAnnual = plIRRFMonthly * 12;

  let dasAnnual = 0;
  let exportTaxSaving = 0;
  let lucroPresumidoTaxAnnual = 0;
  let issAnnual = 0;
  let effectiveRegimeRate = 0;
  let regimeLabel = "";

  if (regime === "simples_iii") {
    const bucket = simplesBracketIndex(grossAnnual, SIMPLES_ANEXO_III);
    const rate = simplesRate(grossAnnual, SIMPLES_ANEXO_III);
    const gross = grossAnnual * rate;

    // Export: remove ISS portion from DAS
    if (isExport) {
      const repart = ANEXO_III_REPARTICAO[bucket];
      const reliefShare = repart.iss; // conservative: remove ISS only
      exportTaxSaving = gross * reliefShare;
    }
    dasAnnual = gross - exportTaxSaving;
    effectiveRegimeRate = grossAnnual > 0 ? dasAnnual / grossAnnual : 0;
    regimeLabel = isExport ? "Simples III — exportação" : "Simples Nacional — Anexo III";
  } else if (regime === "simples_v") {
    const rate = simplesRate(grossAnnual, SIMPLES_ANEXO_V);
    const gross = grossAnnual * rate;
    if (isExport) {
      // Anexo V: ISS ≈ 14% of DAS; still conservative
      exportTaxSaving = gross * 0.14;
    }
    dasAnnual = gross - exportTaxSaving;
    effectiveRegimeRate = grossAnnual > 0 ? dasAnnual / grossAnnual : 0;
    regimeLabel = isExport ? "Simples V — exportação" : "Simples Nacional — Anexo V";
  } else {
    // Lucro Presumido
    const base = grossAnnual * 0.32;
    const irpjBase = base * 0.15;
    const irpjAdicional = Math.max(0, base - 240_000) * 0.1;
    const csll = base * 0.09;
    const pis = isExport ? 0 : grossAnnual * 0.0065;
    const cofins = isExport ? 0 : grossAnnual * 0.03;
    issAnnual = isExport ? 0 : grossAnnual * issRate;
    lucroPresumidoTaxAnnual = irpjBase + irpjAdicional + csll + pis + cofins + issAnnual;
    if (isExport) {
      // "Economia" = o que teria pago de ISS + PIS + COFINS
      exportTaxSaving = grossAnnual * (issRate + 0.0065 + 0.03);
    }
    effectiveRegimeRate = grossAnnual > 0 ? lucroPresumidoTaxAnnual / grossAnnual : 0;
    regimeLabel = isExport ? "Lucro Presumido — exportação" : "Lucro Presumido";
  }

  const accountantAnnual = accountantMonthly * 12;
  const outOfPocketBenefitsAnnual = (healthOutOfPocket + benefitsOutOfPocket) * 12;

  const totalTaxes =
    dasAnnual + lucroPresumidoTaxAnnual + proLaboreINSSAnnual + proLaboreIRRFAnnual + iofAnnual;
  const totalCosts = totalTaxes + accountantAnnual + outOfPocketBenefitsAnnual;
  const netCashAnnual = grossAnnual - totalCosts;

  const effectiveTaxRate = grossAnnual > 0 ? totalTaxes / grossAnnual : 0;

  return {
    grossAnnual, grossAnnualOriginal, iofAnnual,
    dasAnnual, exportTaxSaving, lucroPresumidoTaxAnnual,
    proLaboreINSSAnnual, proLaboreIRRFAnnual,
    accountantAnnual, issAnnual, outOfPocketBenefitsAnnual,
    netCashAnnual, effectiveTaxRate, effectiveRegimeRate, regimeLabel,
    monthlyNet: netCashAnnual / 12,
    currency, exchangeRate, isExport,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Safety-adjusted comparison
// ──────────────────────────────────────────────────────────────────────────

export interface SafetyAdjustment {
  expectedUnemploymentBenefit: number;
  expectedTerminationFine: number;
  pjSelfInsuranceCost: number;
}

export function computeSafety(s: SafetyInput, clt: CLTBreakdown): SafetyAdjustment {
  const avgParcels = 4;
  const expectedUnemploymentBenefit =
    s.unemploymentProbability * Math.min(SEGURO_DESEMPREGO_MAX, clt.grossAnnual / 12) * avgParcels;
  const expectedTerminationFine = s.unemploymentProbability * clt.fgtsAnnual * 0.4;
  const reserveContribution = (s.emergencyMonths * s.monthlyExpenses) / 12;
  const pjSelfInsuranceCost =
    reserveContribution + expectedUnemploymentBenefit + expectedTerminationFine;

  return { expectedUnemploymentBenefit, expectedTerminationFine, pjSelfInsuranceCost };
}

// ──────────────────────────────────────────────────────────────────────────
// Final comparison
// ──────────────────────────────────────────────────────────────────────────

export interface Comparison {
  clt: CLTBreakdown;
  pj: PJBreakdown;
  safety: SafetyAdjustment;
  cltAdjustedAnnual: number;
  pjAdjustedAnnual: number;
  delta: number;
  winner: "clt" | "pj";
  breakEvenPJInvoice: number; // in the PJ's own currency
}

export function compare(cltIn: CLTInput, pjIn: PJInput, safetyIn: SafetyInput): Comparison {
  const clt = computeCLT(cltIn);
  const pj = computePJ(pjIn);
  const safety = computeSafety(safetyIn, clt);

  const cltAdjustedAnnual =
    clt.netWithBenefitsAnnual +
    safety.expectedUnemploymentBenefit +
    safety.expectedTerminationFine;

  const pjAdjustedAnnual = pj.netCashAnnual - safety.pjSelfInsuranceCost;
  const delta = pjAdjustedAnnual - cltAdjustedAnnual;

  // Break-even: search over invoice value in the PJ's original currency
  const maxLookup =
    pjIn.currency === "USD" ? 50_000 : Math.max(200_000, cltIn.grossMonthly * 5);
  let lo = 0;
  let hi = maxLookup;
  for (let k = 0; k < 48; k++) {
    const mid = (lo + hi) / 2;
    const pjTest = computePJ({ ...pjIn, invoiceMonthly: mid });
    const adj = pjTest.netCashAnnual - safety.pjSelfInsuranceCost;
    if (adj < cltAdjustedAnnual) lo = mid;
    else hi = mid;
  }
  const breakEvenPJInvoice = (lo + hi) / 2;

  return {
    clt, pj, safety,
    cltAdjustedAnnual, pjAdjustedAnnual, delta,
    winner: delta >= 0 ? "pj" : "clt",
    breakEvenPJInvoice,
  };
}
