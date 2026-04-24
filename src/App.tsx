import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Asterisk,
  ExternalLink,
  ScrollText,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { NumberField } from "@/components/NumberField";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/toggle-group";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, fmt } from "@/lib/utils";
import {
  compare,
  type CLTInput,
  type Currency,
  type PJInput,
  type Regime,
  type SafetyInput,
} from "@/lib/tax";
import { CompositionChart, BreakEvenChart } from "@/components/Charts";

// ──────────────────────────────────────────────────────────────────────────
// Default values — realistic Brazilian tech scenario, 2025
// ──────────────────────────────────────────────────────────────────────────

const defaultCLT: CLTInput = {
  grossMonthly: 15_000,
  plrAnnual: 20_000,
  dependents: 0,
  vaVr: 1_000,
  vtMonthly: 0,
  healthInsuranceCompany: 700,
  otherBenefits: 200,
};

const defaultPJ: PJInput = {
  currency: "BRL",
  invoiceMonthly: 22_000,
  exchangeRate: 5.45,
  isExport: false,
  regime: "simples_iii",
  proLaboreMonthly: 1_621,
  accountantMonthly: 250,
  issRate: 0.03,
  healthOutOfPocket: 900,
  benefitsOutOfPocket: 1_200,
};

const defaultSafety: SafetyInput = {
  emergencyMonths: 6,
  monthlyExpenses: 8_000,
  unemploymentProbability: 0.15,
};

// ──────────────────────────────────────────────────────────────────────────
// App
// ──────────────────────────────────────────────────────────────────────────

export default function App() {
  const [clt, setCLT] = useState<CLTInput>(defaultCLT);
  const [pj, setPJ] = useState<PJInput>(defaultPJ);
  const [safety, setSafety] = useState<SafetyInput>(defaultSafety);

  const result = useMemo(() => compare(clt, pj, safety), [clt, pj, safety]);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 pb-24 pt-10 md:px-10 lg:px-14">
      <Header />

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-14">
        {/* ── LEFT — Input ledger ─────────────────────────── */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <InputPanel
            clt={clt}
            setCLT={setCLT}
            pj={pj}
            setPJ={setPJ}
            safety={safety}
            setSafety={setSafety}
          />
        </aside>

        {/* ── RIGHT — The page ────────────────────────────── */}
        <main className="flex min-w-0 flex-col gap-10">
          <Verdict comparison={result} pjInvoice={pj.invoiceMonthly} />
          <LedgerComparison comparison={result} />
          <CompositionSection comparison={result} />
          <BreakEvenSection clt={clt} pj={pj} safety={safety} comparison={result} />
          <Assumptions />
        </main>
      </div>

      <Footer />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Header
// ──────────────────────────────────────────────────────────────────────────

function Header() {
  const today = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="border-b border-rule pb-8"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-ember" />
          <span className="eyebrow">O Balanço — edição nº 01</span>
        </div>
        <span className="eyebrow num">{today}</span>
      </div>

      <h1 className="mt-5 text-[clamp(3rem,7vw,6rem)] font-light leading-[0.92] tracking-[-0.03em]">
        <span className="italic" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>CLT</span>{" "}
        <span className="text-ink-3">vs</span>{" "}
        <span className="italic" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>PJ</span>
        <span className="text-ember">.</span>
      </h1>

      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-2">
        Uma análise editorial — com impostos reais, 13º, férias, PLR, benefícios e{" "}
        <em className="text-ember">margem de segurança</em> — para a decisão mais cara da
        carreira de quem trabalha em tecnologia no Brasil.
      </p>
    </motion.header>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Input panel
// ──────────────────────────────────────────────────────────────────────────

function InputPanel({
  clt,
  setCLT,
  pj,
  setPJ,
  safety,
  setSafety,
}: {
  clt: CLTInput;
  setCLT: (c: CLTInput) => void;
  pj: PJInput;
  setPJ: (p: PJInput) => void;
  safety: SafetyInput;
  setSafety: (s: SafetyInput) => void;
}) {
  return (
    <div className="flex flex-col gap-10">
      {/* CLT */}
      <section className="flex flex-col gap-5">
        <SectionHeader
          icon={<Wallet className="h-3.5 w-3.5" />}
          eyebrow="Seção I"
          title="Se eu for CLT"
          accent="ember"
        />
        <NumberField
          label="Salário bruto mensal"
          value={clt.grossMonthly}
          onChange={(v) => setCLT({ ...clt, grossMonthly: v })}
          accent="ember"
        />
        <NumberField
          label="PLR anual"
          value={clt.plrAnnual}
          onChange={(v) => setCLT({ ...clt, plrAnnual: v })}
          accent="ember"
          hint="pago 1×/ano"
        />
        <div className="grid grid-cols-2 gap-4">
          <NumberField
            label="VR / VA"
            value={clt.vaVr}
            onChange={(v) => setCLT({ ...clt, vaVr: v })}
            accent="ember"
            hint="mensal"
          />
          <NumberField
            label="Plano saúde"
            value={clt.healthInsuranceCompany}
            onChange={(v) => setCLT({ ...clt, healthInsuranceCompany: v })}
            accent="ember"
            hint="empresa"
          />
          <NumberField
            label="Outros benefícios"
            value={clt.otherBenefits}
            onChange={(v) => setCLT({ ...clt, otherBenefits: v })}
            accent="ember"
            hint="mensal"
          />
          <NumberField
            label="Dependentes"
            value={clt.dependents}
            onChange={(v) => setCLT({ ...clt, dependents: Math.round(v) })}
            prefix=""
            step={1}
            accent="ember"
          />
        </div>
      </section>

      <Separator />

      {/* PJ */}
      <section className="flex flex-col gap-5">
        <SectionHeader
          icon={<ScrollText className="h-3.5 w-3.5" />}
          eyebrow="Seção II"
          title="Se eu for PJ"
          accent="viridian"
        />

        {/* Currency toggle */}
        <div className="flex flex-col gap-2">
          <Label className="flex items-center gap-2">
            <span className="inline-block h-1 w-1 bg-viridian" aria-hidden />
            <span className="flex-1">Moeda do contrato</span>
          </Label>
          <Segmented<Currency>
            value={pj.currency}
            onChange={(c) =>
              setPJ({
                ...pj,
                currency: c,
                // Default: USD contracts are exports
                isExport: c === "USD" ? true : pj.isExport,
                // Sensible default invoice on switch
                invoiceMonthly:
                  c === "USD" && pj.currency === "BRL"
                    ? Math.round(pj.invoiceMonthly / pj.exchangeRate)
                    : c === "BRL" && pj.currency === "USD"
                    ? Math.round(pj.invoiceMonthly * pj.exchangeRate)
                    : pj.invoiceMonthly,
              })
            }
            options={[
              { value: "BRL", label: "R$ BRL" },
              { value: "USD", label: "US$ USD" },
            ]}
          />
        </div>

        <NumberField
          label={pj.currency === "USD" ? "Nota fiscal mensal (USD)" : "Nota fiscal mensal"}
          value={pj.invoiceMonthly}
          onChange={(v) => setPJ({ ...pj, invoiceMonthly: v })}
          prefix={pj.currency === "USD" ? "US$" : "R$"}
          accent="viridian"
          hint={
            pj.currency === "USD"
              ? `≈ ${fmt.brl0(pj.invoiceMonthly * pj.exchangeRate)}/mês`
              : undefined
          }
        />

        {pj.currency === "USD" && (
          <div className="grid grid-cols-2 gap-4">
            <NumberField
              label="Câmbio USD/BRL"
              value={pj.exchangeRate}
              onChange={(v) => setPJ({ ...pj, exchangeRate: v })}
              prefix="R$"
              step={0.01}
              accent="viridian"
              hint="cotação comercial"
            />
            <div className="flex flex-col gap-1.5">
              <Label className="flex items-center gap-2">
                <span className="inline-block h-1 w-1 bg-viridian" aria-hidden />
                <span className="flex-1">Exportação de serviços</span>
              </Label>
              <div className="flex h-9 items-center gap-2 border-b border-rule">
                <Checkbox
                  checked={pj.isExport}
                  onChange={(v) => setPJ({ ...pj, isExport: v })}
                  accent="viridian"
                />
                <span className="text-[12px] font-mono text-ink-3">
                  {pj.isExport ? "ISS/PIS/COFINS isentos" : "tributação normal"}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label className="flex items-center gap-2">
            <span className="inline-block h-1 w-1 bg-viridian" aria-hidden />
            <span className="flex-1">Regime tributário</span>
          </Label>
          <Select
            value={pj.regime}
            onValueChange={(v: Regime) => setPJ({ ...pj, regime: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simples_iii">Simples — Anexo III</SelectItem>
              <SelectItem value="simples_v">Simples — Anexo V</SelectItem>
              <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <NumberField
            label="Pró-labore"
            value={pj.proLaboreMonthly}
            onChange={(v) => setPJ({ ...pj, proLaboreMonthly: v })}
            accent="viridian"
            hint="mensal"
          />
          <NumberField
            label="Contador"
            value={pj.accountantMonthly}
            onChange={(v) => setPJ({ ...pj, accountantMonthly: v })}
            accent="viridian"
            hint="mensal"
          />
          <NumberField
            label="ISS"
            value={pj.issRate * 100}
            onChange={(v) => setPJ({ ...pj, issRate: v / 100 })}
            prefix=""
            suffix="%"
            step={0.1}
            accent="viridian"
            hint="só LP"
          />
          <NumberField
            label="Plano saúde"
            value={pj.healthOutOfPocket}
            onChange={(v) => setPJ({ ...pj, healthOutOfPocket: v })}
            accent="viridian"
            hint="do seu bolso"
          />
        </div>
        <NumberField
          label="Benefícios equivalentes"
          value={pj.benefitsOutOfPocket}
          onChange={(v) => setPJ({ ...pj, benefitsOutOfPocket: v })}
          accent="viridian"
          hint="VR, gympass, stipends"
        />
      </section>

      <Separator />

      {/* Safety */}
      <section className="flex flex-col gap-5">
        <SectionHeader
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          eyebrow="Seção III"
          title="Margem de segurança"
          accent="ember"
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <Label>Meses de reserva de emergência</Label>
            <span className="num text-[15px] text-ink">
              {safety.emergencyMonths}
            </span>
          </div>
          <Slider
            value={[safety.emergencyMonths]}
            min={0}
            max={24}
            step={1}
            onValueChange={(v) =>
              setSafety({ ...safety, emergencyMonths: v[0] })
            }
          />
          <div className="flex justify-between text-[10px] font-mono text-ink-3">
            <span>0</span>
            <span>6</span>
            <span>12</span>
            <span>24</span>
          </div>
        </div>

        <NumberField
          label="Despesas mensais"
          value={safety.monthlyExpenses}
          onChange={(v) => setSafety({ ...safety, monthlyExpenses: v })}
          hint="custo de vida"
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <Label>Probabilidade de demissão / ano</Label>
            <span className="num text-[15px] text-ink">
              {Math.round(safety.unemploymentProbability * 100)}%
            </span>
          </div>
          <Slider
            value={[safety.unemploymentProbability * 100]}
            min={0}
            max={60}
            step={1}
            onValueChange={(v) =>
              setSafety({ ...safety, unemploymentProbability: v[0] / 100 })
            }
          />
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  icon,
  eyebrow,
  title,
  accent,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  accent: "ember" | "viridian";
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex h-5 w-5 items-center justify-center",
            accent === "ember" ? "text-ember" : "text-viridian"
          )}
        >
          {icon}
        </span>
        <span className="eyebrow">{eyebrow}</span>
      </div>
      <h3 className="text-[22px] font-light leading-tight tracking-tight">
        {title}
      </h3>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Verdict hero
// ──────────────────────────────────────────────────────────────────────────

function Verdict({
  comparison,
  pjInvoice,
}: {
  comparison: ReturnType<typeof compare>;
  pjInvoice: number;
}) {
  const { winner, delta, cltAdjustedAnnual, pjAdjustedAnnual, breakEvenPJInvoice, pj } = comparison;
  const isUSD = pj.currency === "USD";
  const fmtInvoice = (v: number) =>
    isUSD ? `US$ ${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : fmt.brl0(v);
  const absDelta = Math.abs(delta);
  const winnerColor = winner === "clt" ? "text-ember" : "text-viridian";
  const winnerLabel = winner === "clt" ? "CLT" : "PJ";
  const margin = Math.abs(delta) / Math.max(cltAdjustedAnnual, pjAdjustedAnnual);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="border border-rule bg-paper-2/40 px-6 py-8 md:px-10 md:py-12"
    >
      <div className="flex items-center gap-3">
        <span className="eyebrow">O Veredicto</span>
        <span className="h-px flex-1 bg-rule" />
        <span className="eyebrow num">δ {fmt.brl0(absDelta)}/ano</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={winner}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.5 }}
          className="mt-6 flex items-baseline gap-4 flex-wrap"
        >
          <h2 className="text-[clamp(2.6rem,5.5vw,4.75rem)] font-light leading-none tracking-tight">
            <span className="text-ink-3">Fique</span>{" "}
            <span
              className={cn("italic", winnerColor)}
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "wght" 500' }}
            >
              {winnerLabel}
            </span>
            <span className={winnerColor}>.</span>
          </h2>
          <div className={cn("flex items-center gap-1", winnerColor)}>
            {winner === "pj" ? (
              <ArrowUpRight className="h-5 w-5" />
            ) : (
              <ArrowDownRight className="h-5 w-5" />
            )}
            <span className="num text-lg">{fmt.pct(margin)}</span>
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-ink-2">
        {winner === "pj" ? (
          <>
            Ajustado para risco, <em className="text-viridian not-italic font-medium">PJ</em> sobra{" "}
            <span className="num text-ink">{fmt.brl(absDelta)}</span> por ano. Para empatar com o pacote CLT equivalente, sua NF mensal PJ precisaria cair até{" "}
            <span className="num text-ink">{fmtInvoice(breakEvenPJInvoice)}</span>
            {isUSD && (
              <span className="num text-ink-3">
                {" "}(≈ {fmt.brl0(breakEvenPJInvoice * pj.exchangeRate)})
              </span>
            )}
            .
          </>
        ) : (
          <>
            Ajustado para risco, <em className="text-ember not-italic font-medium">CLT</em> sobra{" "}
            <span className="num text-ink">{fmt.brl(absDelta)}</span> por ano. Para empatar, sua NF mensal PJ precisaria subir para{" "}
            <span className="num text-ink">{fmtInvoice(breakEvenPJInvoice)}</span>
            {isUSD && (
              <span className="num text-ink-3">
                {" "}(≈ {fmt.brl0(breakEvenPJInvoice * pj.exchangeRate)})
              </span>
            )}
            {pjInvoice > 0 && (
              <>
                {" "}— hoje está em{" "}
                <span className="num text-ink">{fmtInvoice(pjInvoice)}</span>.
              </>
            )}
          </>
        )}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <StatCard
          label="CLT líquido ajustado"
          accent="ember"
          annual={cltAdjustedAnnual}
          active={winner === "clt"}
        />
        <StatCard
          label="PJ líquido ajustado"
          accent="viridian"
          annual={pjAdjustedAnnual}
          active={winner === "pj"}
        />
      </div>
    </motion.section>
  );
}

function StatCard({
  label,
  accent,
  annual,
  active,
}: {
  label: string;
  accent: "ember" | "viridian";
  annual: number;
  active: boolean;
}) {
  const color = accent === "ember" ? "text-ember" : "text-viridian";
  const barColor = accent === "ember" ? "bg-ember" : "bg-viridian";
  return (
    <div className={cn("border border-rule p-5", active && "bg-paper-2")}>
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        {active && (
          <div className="flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full pulse-dot", barColor)} />
            <span className={cn("text-[10px] tracking-widest font-medium uppercase", color)}>
              vencedor
            </span>
          </div>
        )}
      </div>
      <div className={cn("mt-3 num text-3xl font-light", active ? color : "text-ink")}>
        {fmt.brl(annual)}
      </div>
      <div className="mt-1 text-[11px] font-mono text-ink-3">
        {fmt.brl(annual / 12)} / mês
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Ledger — side-by-side financial breakdown
// ──────────────────────────────────────────────────────────────────────────

type LedgerRow = {
  label: string;
  clt: number | string;
  pj: number | string;
  hint?: string;
};

// Column template only — callers add `grid` / `hidden md:grid` themselves so the
// `display` utility doesn't collide with twMerge.
const LEDGER_COLS =
  "grid-cols-[minmax(0,1fr)_minmax(96px,auto)_minmax(96px,auto)] md:grid-cols-[minmax(0,1fr)_180px_180px]";

function LedgerComparison({ comparison }: { comparison: ReturnType<typeof compare> }) {
  const { clt, pj, safety, cltAdjustedAnnual, pjAdjustedAnnual, winner } = comparison;

  const mainRows: LedgerRow[] = [];

  if (pj.currency === "USD") {
    mainRows.push({
      label: "Faturamento anual (USD)",
      clt: "—",
      pj: `US$ ${pj.grossAnnualOriginal.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      hint: `câmbio R$ ${pj.exchangeRate.toFixed(2)}`,
    });
  }

  mainRows.push(
    { label: "Valor bruto anual", clt: clt.grossAnnual, pj: pj.grossAnnual },
    { label: "INSS", clt: -clt.inssAnnual, pj: -pj.proLaboreINSSAnnual, hint: "progressivo / pró-labore" },
    {
      label: "IRRF",
      clt: -clt.irrfAnnual,
      pj: -pj.proLaboreIRRFAnnual,
      hint: "com redutor Lei 15.270/25 / pró-labore",
    },
    {
      label: pj.regimeLabel || "Regime PJ",
      clt: "—",
      pj: -(pj.dasAnnual + pj.lucroPresumidoTaxAnnual),
      hint: "DAS ou tributos LP",
    }
  );

  if (pj.exportTaxSaving > 0) {
    mainRows.push({
      label: "Economia — exportação",
      clt: "—",
      pj: +pj.exportTaxSaving,
      hint: "ISS/PIS/COFINS não incidem",
    });
  }
  if (pj.iofAnnual > 0) {
    mainRows.push({
      label: "IOF câmbio",
      clt: "—",
      pj: -pj.iofAnnual,
      hint: "0,38% no ingresso",
    });
  }

  mainRows.push(
    { label: "Contador", clt: "—", pj: -pj.accountantAnnual },
    { label: "13º salário (líq.)", clt: clt.thirteenthNet, pj: "—" },
    { label: "1/3 férias (líq.)", clt: clt.vacationNet, pj: "—" },
    { label: "PLR (líq.)", clt: clt.plrNet, pj: "—" },
    {
      label: "Benefícios",
      clt: clt.benefitsAnnual,
      pj: -pj.outOfPocketBenefitsAnnual,
      hint: "VR, saúde, stipends",
    },
    { label: "FGTS acumulado", clt: clt.fgtsAnnual, pj: "—", hint: "8% do salário ao ano" }
  );

  const riskRows: LedgerRow[] = [
    {
      label: "Seguro-desemprego esperado",
      clt: +safety.expectedUnemploymentBenefit,
      pj: "—",
      hint: "probabilidade × valor",
    },
    {
      label: "Multa rescisória esperada",
      clt: +safety.expectedTerminationFine,
      pj: "—",
      hint: "40% FGTS × prob.",
    },
    {
      label: "Auto-seguro (reserva)",
      clt: "—",
      pj: -safety.pjSelfInsuranceCost,
      hint: "aporte anual para cobrir o risco",
    },
  ];

  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <Asterisk className="h-4 w-4 text-ink-3" />
        <span className="eyebrow">O Livro-Razão</span>
        <span className="h-px flex-1 bg-rule" />
      </div>

      <LedgerCard rows={mainRows} withHeader />

      <TotalStrip
        eyebrow="Subtotal"
        label="Líquido antes de risco"
        clt={clt.netWithBenefitsAnnual}
        pj={pj.netCashAnnual}
      />

      <LedgerCard rows={riskRows} sectionLabel="Ajustes ao risco" />

      <TotalStrip
        eyebrow="Total ajustado ao risco"
        label={winner === "clt" ? "Com CLT, você sai na frente" : "Com PJ, você sai na frente"}
        clt={cltAdjustedAnnual}
        pj={pjAdjustedAnnual}
        winner={winner}
        final
      />

      {/* Alíquota efetiva — metadata footer, aligned with ledger columns */}
      <div
        className={cn(
          "grid items-baseline border-t border-rule/50 mt-4 pt-3",
          LEDGER_COLS
        )}
      >
        <div className="px-4 text-[11px] uppercase tracking-widest text-ink-3">
          Alíquota efetiva
        </div>
        <div className="px-4 text-right num text-[12px] text-ink-3">
          {fmt.pct(clt.effectiveTaxRate)}
        </div>
        <div className="px-4 text-right num text-[12px] text-ink-3">
          {fmt.pct(pj.effectiveTaxRate)}
        </div>
      </div>
    </section>
  );
}

function LedgerCard({
  rows,
  withHeader = false,
  sectionLabel,
}: {
  rows: LedgerRow[];
  withHeader?: boolean;
  sectionLabel?: string;
}) {
  return (
    <div className="border border-rule bg-paper-2/20">
      {withHeader && (
        <div className={cn("grid border-b border-rule", LEDGER_COLS)}>
          <div className="px-4 py-3 text-[11px] uppercase tracking-widest text-ink-3">
            Item
          </div>
          <div className="px-4 py-3 text-right text-[11px] uppercase tracking-widest text-ember">
            CLT
          </div>
          <div className="px-4 py-3 text-right text-[11px] uppercase tracking-widest text-viridian">
            PJ
          </div>
        </div>
      )}
      {sectionLabel && (
        <div className="border-b border-rule/50 px-4 py-2">
          <span className="eyebrow">{sectionLabel}</span>
        </div>
      )}
      {rows.map((r, i) => (
        <div
          key={i}
          className={cn(
            "ledger-row grid items-baseline border-b border-rule last:border-b-0",
            LEDGER_COLS
          )}
        >
          <div className="flex min-w-0 flex-col px-4 py-2.5">
            <span className="text-[13px] text-ink-2">{r.label}</span>
            {r.hint && (
              <span className="mt-0.5 text-[10.5px] font-mono text-ink-3">
                {r.hint}
              </span>
            )}
          </div>
          <LedgerCell value={r.clt} />
          <LedgerCell value={r.pj} />
        </div>
      ))}
    </div>
  );
}

function LedgerCell({ value }: { value: number | string }) {
  if (value === "" || value === "—") {
    return (
      <div className="px-4 py-2.5 text-right text-ink-3 num text-[13px]">
        {value}
      </div>
    );
  }
  if (typeof value === "string") {
    return (
      <div className="px-4 py-2.5 text-right num text-[13px] text-ink-2">
        {value}
      </div>
    );
  }
  const negative = value < 0;
  return (
    <div
      className={cn(
        "px-4 py-2.5 text-right num tabular-nums text-[13.5px]",
        negative ? "text-blood" : "text-ink"
      )}
    >
      {negative ? "−" : ""}
      {fmt.brl(Math.abs(value))}
    </div>
  );
}

function TotalStrip({
  eyebrow,
  label,
  clt,
  pj,
  winner,
  final = false,
}: {
  eyebrow: string;
  label: string;
  clt: number;
  pj: number;
  winner?: "clt" | "pj";
  final?: boolean;
}) {
  const cltWinning = winner === "clt";
  const pjWinning = winner === "pj";
  const rulePx = final ? "h-[1.5px]" : "h-px";

  return (
    <div className={cn(final ? "my-6" : "my-4")}>
      <div className={cn(rulePx, "bg-rule")} />
      <div
        className={cn(
          "px-5",
          final ? "bg-paper-3/50 py-6" : "bg-paper-2/50 py-5"
        )}
      >
        {/* Desktop — aligned with ledger columns */}
        <div className={cn("hidden md:grid items-center", LEDGER_COLS)}>
          <div className="px-0 flex flex-col gap-1 min-w-0">
            <span className="eyebrow">{eyebrow}</span>
            <span
              className={cn(
                "display leading-tight text-ink",
                final ? "text-[26px]" : "text-[20px]"
              )}
            >
              {label}
            </span>
          </div>
          <div
            className={cn(
              "px-4 text-right num tabular-nums flex items-center justify-end gap-2",
              final ? "text-[21px]" : "text-[17px]",
              cltWinning ? "text-ember" : "text-ink-2"
            )}
          >
            {fmt.brl(clt)}
            {cltWinning && final && (
              <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-ember" />
            )}
          </div>
          <div
            className={cn(
              "px-4 text-right num tabular-nums flex items-center justify-end gap-2",
              final ? "text-[21px]" : "text-[17px]",
              pjWinning ? "text-viridian" : "text-ink-2"
            )}
          >
            {fmt.brl(pj)}
            {pjWinning && final && (
              <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-viridian" />
            )}
          </div>
        </div>

        {/* Mobile — stacked */}
        <div className="md:hidden flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="eyebrow">{eyebrow}</span>
            <span
              className={cn(
                "display leading-tight text-ink",
                final ? "text-[20px]" : "text-[17px]"
              )}
            >
              {label}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-rule/40 pt-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase tracking-widest text-ember font-medium">
                CLT
              </span>
              <span
                className={cn(
                  "num tabular-nums",
                  final ? "text-[17px]" : "text-[14.5px]",
                  cltWinning ? "text-ember" : "text-ink"
                )}
              >
                {fmt.brl(clt)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 items-end">
              <span className="text-[9px] uppercase tracking-widest text-viridian font-medium">
                PJ
              </span>
              <span
                className={cn(
                  "num tabular-nums",
                  final ? "text-[17px]" : "text-[14.5px]",
                  pjWinning ? "text-viridian" : "text-ink"
                )}
              >
                {fmt.brl(pj)}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className={cn(rulePx, "bg-rule")} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Composition section
// ──────────────────────────────────────────────────────────────────────────

function CompositionSection({ comparison }: { comparison: ReturnType<typeof compare> }) {
  return (
    <section>
      <div className="mb-5 flex items-center gap-3">
        <span className="eyebrow">A Decomposição</span>
        <span className="h-px flex-1 bg-rule" />
      </div>
      <h3 className="display text-2xl font-light mb-1">Para onde vai cada real.</h3>
      <p className="text-[13.5px] text-ink-3 mb-6">
        Empilhado — da esquerda (líquido no bolso) para a direita (imposto).
      </p>
      <div className="border border-rule bg-paper-2/20 p-4 pr-6">
        <CompositionChart comparison={comparison} />
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Break-even section
// ──────────────────────────────────────────────────────────────────────────

function BreakEvenSection({
  clt,
  pj,
  safety,
  comparison,
}: {
  clt: CLTInput;
  pj: PJInput;
  safety: SafetyInput;
  comparison: ReturnType<typeof compare>;
}) {
  return (
    <section>
      <div className="mb-5 flex items-center gap-3">
        <span className="eyebrow">O Ponto de Equilíbrio</span>
        <span className="h-px flex-1 bg-rule" />
      </div>
      <h3 className="display text-2xl font-light mb-1">
        Onde as duas linhas se cruzam.
      </h3>
      <p className="text-[13.5px] text-ink-3 mb-6">
        Mantendo o pacote CLT fixo, o valor da NF mensal onde PJ iguala CLT é{" "}
        <span className="num text-ink">{fmt.brl(comparison.breakEvenPJInvoice)}</span>.
      </p>
      <div className="border border-rule bg-paper-2/20 p-4 pr-6">
        <BreakEvenChart cltIn={clt} pjIn={pj} safetyIn={safety} />
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Assumptions
// ──────────────────────────────────────────────────────────────────────────

type Src = { label: string; url: string; publisher: string };

const SOURCES = {
  inss: {
    label: "Tabela INSS 2026",
    publisher: "Contabilizei",
    url: "https://www.contabilizei.com.br/contabilidade-online/tabela-inss/",
  },
  irrf: {
    label: "Tabela IRPF 2026 + Lei 15.270/2025",
    publisher: "Contabilidade.com",
    url: "https://contabilidade.com/blog/tabela-irpf-2026-faixas-aliquotas-reducao-do-imposto-e-historico-atualizado/",
  },
  simples: {
    label: "Anexo III Simples Nacional 2026",
    publisher: "Contabilizei",
    url: "https://www.contabilizei.com.br/contabilidade-online/anexo-3-simples-nacional/",
  },
  lp: {
    label: "Quanto minha empresa de serviços paga de impostos",
    publisher: "Contabilizei",
    url: "https://www.contabilizei.com.br/contabilidade-online/quanto-minha-empresa-de-servicos-paga-de-impostos-no-exterior/",
  },
  exportA: {
    label: "Exportação de serviços com Simples — guia para devs",
    publisher: "Colinear",
    url: "https://colinear.com.br/exportacao-de-servicos-com-simples-nacional-guia-para-devs/",
  },
  exportB: {
    label: "Quais impostos são isentos na exportação de serviços",
    publisher: "Colinear",
    url: "https://colinear.com.br/quais-impostos-sao-isentos-na-exportacao-de-servicos/",
  },
  exportC: {
    label: "Tributação para programadores que recebem em dólar",
    publisher: "Logos Contabilidade",
    url: "https://logoscontabilidadedigital.com.br/tributacao-para-programadores-que-recebem-em-dolar/",
  },
  exportD: {
    label: "Impostos sobre exportação de serviços",
    publisher: "Remessa Online",
    url: "https://www.remessaonline.com.br/blog/impostos-sobre-a-exportacao-de-servicos-veja-quais-a-empresa-deve-pagar/",
  },
} satisfies Record<string, Src>;

function SourceLink({ src }: { src: Src }) {
  return (
    <a
      href={src.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-baseline gap-1 text-viridian decoration-viridian/40 underline-offset-4 hover:underline transition-colors"
    >
      <span>{src.label}</span>
      <ExternalLink className="h-3 w-3 translate-y-0.5" />
      <span className="text-ink-3 font-mono text-[11px]">· {src.publisher}</span>
    </a>
  );
}

function Sources({ items, label = "Fonte" }: { items: Src[]; label?: string }) {
  return (
    <div className="mt-3 flex flex-col gap-1 pt-3 border-t border-rule/60">
      <span className="eyebrow text-[10px]">{label}</span>
      {items.map((s) => (
        <SourceLink key={s.url} src={s} />
      ))}
    </div>
  );
}

function Assumptions() {
  return (
    <section className="mt-4">
      <div className="mb-2 flex items-center gap-3">
        <span className="eyebrow">Notas do Editor</span>
        <span className="h-px flex-1 bg-rule" />
      </div>
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="inss">
          <AccordionTrigger>Tabelas INSS e IRRF (2026)</AccordionTrigger>
          <AccordionContent>
            INSS progressivo com alíquotas de 7,5% / 9% / 12% / 14% até o teto de{" "}
            <span className="num text-ink">R$ 8.475,55</span> (desconto máximo{" "}
            <span className="num text-ink">R$ 988,09</span>). IRRF pela tabela progressiva
            clássica + desconto simplificado de R$ 607,20. A partir de janeiro/2026, a{" "}
            <strong className="text-ember">Lei 15.270/2025</strong> introduziu um redutor
            mensal que zera o imposto até R$ 5.000 de renda e reduz gradualmente até R$ 7.350
            pela fórmula <span className="num">R$ 978,62 − 0,133145 × renda bruta</span>.
            <Sources items={[SOURCES.inss, SOURCES.irrf]} label="Fontes" />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="fgts">
          <AccordionTrigger>FGTS, 13º e férias</AccordionTrigger>
          <AccordionContent>
            FGTS de 8% é contabilizado como parte do pacote CLT — o que entra na conta-vinculada
            do trabalhador conta como remuneração diferida. 13º e férias são tributados como
            folhas separadas; incluímos o extra de 1/3 das férias, não o salário férias em si
            (evitando dupla contagem).
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="simples">
          <AccordionTrigger>Simples Nacional — Anexos III e V</AccordionTrigger>
          <AccordionContent>
            Serviços de TI ficam no Anexo III quando o Fator-R (folha / receita dos últimos 12
            meses) atinge 28%. Caso contrário, caem no Anexo V, com alíquotas significativamente
            maiores. Alíquota efetiva é calculada por (receita × alíquota − parcela a deduzir) /
            receita.
            <Sources items={[SOURCES.simples]} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="lp">
          <AccordionTrigger>Lucro Presumido — serviços em geral</AccordionTrigger>
          <AccordionContent>
            Base presumida de 32%. IRPJ 15% + adicional 10% sobre lucro presumido anual acima
            de R$ 240.000. CSLL 9%, PIS 0,65%, COFINS 3%, ISS conforme município (padrão 3%).
            Sem benefícios da tributação única do Simples — vale quando o faturamento é alto e
            o Fator-R baixo.
            <Sources items={[SOURCES.lp]} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="safety">
          <AccordionTrigger>Como calculamos a margem de segurança</AccordionTrigger>
          <AccordionContent>
            CLT recebe crédito pelo valor esperado do seguro-desemprego (probabilidade de
            demissão × valor médio × 4 parcelas) e pela multa de 40% sobre o FGTS acumulado,
            também ponderada pela probabilidade. PJ é debitado pelo custo anual de se
            auto-segurar: a fatia de 1/12 da reserva de emergência desejada, mais os valores
            simétricos do seguro-desemprego e da multa que CLT recebe de graça. É uma
            equivalência financeira — não inclui efeitos psicológicos de estabilidade.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="export">
          <AccordionTrigger>Exportação de serviços (recebimento em USD)</AccordionTrigger>
          <AccordionContent>
            Quando o contrato é em moeda estrangeira e caracteriza{" "}
            <em>exportação de serviços</em> (LC 116/2003), o ISS não incide, e no Simples
            Nacional a parcela do ISS é retirada do DAS via LC 123/2006 art. 18 §14. No Lucro
            Presumido, PIS e COFINS também são zerados. IRPJ, CSLL e CPP (pró-labore) seguem
            sendo devidos. Incide IOF de 0,38% sobre o contrato de câmbio de ingresso. É
            obrigatório emitir nota fiscal para tomador no exterior e manter o contrato de
            câmbio arquivado. A conversão para BRL usa a cotação do fechamento de câmbio.
            <Sources
              items={[
                SOURCES.exportA,
                SOURCES.exportB,
                SOURCES.exportC,
                SOURCES.exportD,
              ]}
              label="Leituras recomendadas"
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="limits">
          <AccordionTrigger>Limitações</AccordionTrigger>
          <AccordionContent>
            Não considera: deduções do IR (saúde, educação, previdência privada), desconto-simbólico
            de VR/VA via PAT, variações do Sublimite Estadual do Simples, ou planejamentos
            tributários mais sofisticados (ex.: distribuição de lucros retida para ajustar o
            Fator-R). Alíquotas de ISS e IRRF municipais variam entre cidades — ajuste o ISS para
            sua realidade.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-10 border-t border-rule pt-8">
        <div className="mb-4 flex items-center gap-3">
          <ExternalLink className="h-3.5 w-3.5 text-viridian" />
          <span className="eyebrow">Fontes & Leituras</span>
          <span className="h-px flex-1 bg-rule" />
        </div>
        <p className="text-[13px] text-ink-3 mb-5 max-w-2xl leading-relaxed">
          Todos os números foram cruzados com estas fontes em abril/2026. Para decidir de fato
          entre CLT e PJ, converse com um contador — esta calculadora é um ponto de partida,
          não um substituto profissional.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Object.values(SOURCES).map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 border border-rule p-4 bg-paper-2/30 hover:bg-paper-2/80 hover:border-viridian/60 transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5 mt-0.5 text-ink-3 group-hover:text-viridian transition-colors shrink-0" />
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-[13.5px] text-ink-2 group-hover:text-ink transition-colors leading-tight">
                  {s.label}
                </span>
                <span className="text-[11px] font-mono text-ink-3 truncate">
                  {s.publisher} · {new URL(s.url).hostname.replace(/^www\./, "")}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-rule pt-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <p className="text-[12px] text-ink-3">
        Calculado localmente no seu navegador. Nenhum dado sai daqui.
      </p>
      <p className="text-[11px] font-mono text-ink-3 tracking-tight">
        Não é aconselhamento contábil. Converse com um contador antes de trocar de regime.
      </p>
    </footer>
  );
}
