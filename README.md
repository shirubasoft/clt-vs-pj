# O Balanço — CLT vs PJ

> **🔗 Live:** [shiruba.software/clt-vs-pj](https://shiruba.software/clt-vs-pj/)  ·  mirror: [shirubasoft.github.io/clt-vs-pj](https://shirubasoft.github.io/clt-vs-pj/)

An editorial-style calculator for the most expensive career decision a
Brazilian tech worker makes: CLT or PJ.

It computes real **2026** Brazilian taxes — INSS (teto R$ 8.475,55), IRRF
with the new Lei 15.270/2025 redutor (isenção até R$ 5k/mês), Simples
Nacional Anexos III/V, Lucro Presumido, ISS and pró-labore — adds mandatory
CLT perks (13º, férias, FGTS, PLR), accounts for cash + in-kind benefits on
both sides, and prices a **safety margin**: expected seguro-desemprego and
multa rescisória for CLT, self-insurance cost for PJ. You get a single
verdict, a line-by-line ledger, two charts, a break-even invoice value, and
every number cross-referenced to its official source.

Supports receiving in **USD** (exportação de serviços) with automatic ISS
removal from DAS, IOF on inbound FX, and break-even computed in the
contract's currency.

All computation happens in your browser — no data leaves your machine.

## Run locally

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
- GitHub Actions → GitHub Pages for deploy

## Not accounting advice

Tables are snapshotted from 2026 Receita Federal portarias, Lei 15.270/2025,
and Resolução CGSN 140/2018. ISS varies by municipality — adjust for your
city. Talk to an actual accountant before switching regimes.
