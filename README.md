# O Balanço — CLT vs PJ

An editorial-style calculator for the most expensive career decision a
Brazilian tech worker makes: CLT or PJ.

It computes real 2025 Brazilian taxes (INSS, IRRF, Simples Nacional Anexos III/V,
Lucro Presumido, ISS, pró-labore), adds mandatory CLT perks (13º, férias, FGTS,
PLR), accounts for cash + in-kind benefits on both sides, and finishes by
pricing a **safety margin** — expected seguro-desemprego and multa rescisória
for CLT, self-insurance cost for PJ. You get a single verdict, a line-by-line
ledger, two charts, and a break-even invoice value.

All computation happens in your browser; no data leaves your machine.

## Run

```bash
pnpm install
pnpm dev
```

Then open http://localhost:5173

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 (no config file — tokens live in `src/index.css`)
- shadcn-style Radix primitives (hand-built under `src/components/ui`)
- Recharts for the composition and break-even charts
- Motion (framer-motion) for header / verdict animations
- Fonts: Fraunces (editorial serif display), Geist (body), JetBrains Mono (numerals)

## Not accounting advice

The tables are snapshotted from the 2025 Receita Federal / Resolução CGSN
140/2018 values. ISS varies by municipality — adjust for your city. Talk to an
actual accountant before switching regimes.
