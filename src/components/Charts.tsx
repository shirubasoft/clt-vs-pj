import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
  Legend,
} from "recharts";
import type { CLTInput, PJInput, SafetyInput, Comparison } from "@/lib/tax";
import { compare } from "@/lib/tax";
import { fmt } from "@/lib/utils";

const EMBER = "oklch(0.78 0.155 62)";
const EMBER_2 = "oklch(0.62 0.165 48)";
const EMBER_3 = "oklch(0.45 0.14 48)";
const VIRIDIAN = "oklch(0.78 0.12 190)";
const VIRIDIAN_2 = "oklch(0.55 0.12 195)";
const VIRIDIAN_3 = "oklch(0.38 0.10 200)";
const INK_3 = "oklch(0.62 0.022 85)";
const RULE = "oklch(0.32 0.018 85)";

// ──────────────────────────────────────────────────────────────────────────
// Composition chart — stacked bars showing where the money goes
// ──────────────────────────────────────────────────────────────────────────

export function CompositionChart({ comparison }: { comparison: Comparison }) {
  const { clt, pj } = comparison;

  const cltImpostos = clt.inssAnnual + clt.irrfAnnual;
  const cltLiquido = clt.netCashAnnual;
  const cltBeneficios = clt.benefitsAnnual + clt.fgtsAnnual;

  const pjImpostos =
    pj.dasAnnual +
    pj.lucroPresumidoTaxAnnual +
    pj.proLaboreINSSAnnual +
    pj.proLaboreIRRFAnnual;
  const pjCustos = pj.accountantAnnual + pj.outOfPocketBenefitsAnnual;
  const pjLiquido = pj.netCashAnnual;

  const data = [
    {
      name: "CLT",
      Líquido: cltLiquido,
      Benefícios: cltBeneficios,
      Impostos: cltImpostos,
    },
    {
      name: "PJ",
      Líquido: pjLiquido,
      Custos: pjCustos,
      Impostos: pjImpostos,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="2 3" stroke={RULE} horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) => fmt.brl0(v)}
          stroke={INK_3}
          tickLine={false}
          axisLine={{ stroke: RULE }}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke={INK_3}
          tickLine={false}
          axisLine={{ stroke: RULE }}
          width={40}
        />
        <Tooltip
          cursor={{ fill: "oklch(1 0 0 / 0.03)" }}
          formatter={(v) => fmt.brl(Number(v))}
        />
        <Legend
          iconType="square"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono" }}
        />
        <Bar dataKey="Líquido" stackId="a" fill={EMBER}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.name === "CLT" ? EMBER : VIRIDIAN} />
          ))}
        </Bar>
        <Bar dataKey="Benefícios" stackId="a" fill={EMBER_2} />
        <Bar dataKey="Custos" stackId="a" fill={VIRIDIAN_2} />
        <Bar dataKey="Impostos" stackId="a" fill={EMBER_3}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.name === "CLT" ? EMBER_3 : VIRIDIAN_3}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Break-even curve — how PJ net varies across invoice range
// ──────────────────────────────────────────────────────────────────────────

export function BreakEvenChart({
  cltIn,
  pjIn,
  safetyIn,
}: {
  cltIn: CLTInput;
  pjIn: PJInput;
  safetyIn: SafetyInput;
}) {
  const currentPJ = pjIn.invoiceMonthly;
  const isUSD = pjIn.currency === "USD";
  const maxInvoice = isUSD
    ? Math.max(12000, currentPJ * 1.8, (cltIn.grossMonthly * 2.5) / pjIn.exchangeRate)
    : Math.max(50000, currentPJ * 1.6, cltIn.grossMonthly * 2.5);
  const minInvoice = isUSD
    ? Math.max(500, (cltIn.grossMonthly * 0.5) / pjIn.exchangeRate)
    : Math.max(3000, cltIn.grossMonthly * 0.6);
  const steps = 40;
  const stepSize = (maxInvoice - minInvoice) / steps;

  const data = [];
  let cltLine = 0;
  let breakEven = 0;
  for (let k = 0; k <= steps; k++) {
    const invoice = minInvoice + k * stepSize;
    const c = compare(cltIn, { ...pjIn, invoiceMonthly: invoice }, safetyIn);
    cltLine = c.cltAdjustedAnnual;
    breakEven = c.breakEvenPJInvoice;
    data.push({
      invoice,
      "PJ ajustado": c.pjAdjustedAnnual,
      "CLT ajustado": c.cltAdjustedAnnual,
    });
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 25, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="2 3" stroke={RULE} />
        <XAxis
          dataKey="invoice"
          tickFormatter={(v) =>
            isUSD
              ? `${(v / 1000).toFixed(1)}k`
              : fmt.brl0(v).replace("R$", "").trim()
          }
          stroke={INK_3}
          tickLine={false}
          axisLine={{ stroke: RULE }}
          label={{
            value: isUSD ? "NF mensal PJ (US$)" : "NF mensal PJ (R$)",
            position: "insideBottom",
            offset: -5,
            fontSize: 10,
            fill: INK_3,
            fontFamily: "JetBrains Mono",
          }}
        />
        <YAxis
          tickFormatter={(v) => fmt.brl0(v).replace("R$", "").trim()}
          stroke={INK_3}
          tickLine={false}
          axisLine={{ stroke: RULE }}
          width={60}
        />
        <Tooltip
          formatter={(v) => fmt.brl(Number(v))}
          labelFormatter={(l) =>
            isUSD
              ? `NF: US$ ${Number(l).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
              : `NF: ${fmt.brl(Number(l))}`
          }
        />
        <Legend
          iconType="plainline"
          iconSize={14}
          wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono" }}
        />
        <ReferenceLine
          x={breakEven}
          stroke={EMBER}
          strokeDasharray="3 3"
          label={{
            value: isUSD
              ? `break-even US$ ${breakEven.toFixed(0)}`
              : `break-even ${fmt.brl0(breakEven)}`,
            fill: EMBER,
            fontSize: 10,
            fontFamily: "JetBrains Mono",
            position: "top",
          }}
        />
        <ReferenceLine
          x={currentPJ}
          stroke={VIRIDIAN}
          strokeDasharray="1 2"
          label={{
            value: "você",
            fill: VIRIDIAN,
            fontSize: 10,
            fontFamily: "JetBrains Mono",
            position: "insideTopRight",
          }}
        />
        <Line
          type="monotone"
          dataKey="CLT ajustado"
          stroke={EMBER}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: EMBER }}
        />
        <Line
          type="monotone"
          dataKey="PJ ajustado"
          stroke={VIRIDIAN}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: VIRIDIAN }}
        />
        {/* invisible reference to suppress unused-var lint */}
        <ReferenceLine y={cltLine} stroke="transparent" />
      </LineChart>
    </ResponsiveContainer>
  );
}
