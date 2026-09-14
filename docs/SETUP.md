# Local preview and voice configuration

Use Node.js 22 and npm.

```bash
npm ci
npm run verify
npm audit --omit=dev
```

These local checks do not make paid provider requests. For a static catalog preview without functions:

```bash
python3 -m http.server 8080 --directory public
```

The static preview supports catalog controls; voice requires the deployed Netlify functions and configuration.

To deploy your own instance, use this repository's [netlify.toml](../netlify.toml): publish only `public/`, with `netlify/functions/` deployed as functions. Set your own `OPENAI_API_KEY`, random `WATCHDOG_SECRET` and exact HTTPS `SITE_ORIGIN` through protected runtime configuration. Never place values in public assets or source control. The source currently requests `gpt-live-1` for voice and `gpt-5.6-luna` for the planner; your provider account must support those interfaces.

The existing public site was authorized for a $14 AgentMart allocation within a combined $30 AgentMart/portfolio allowance. Current remaining availability is reported dynamically by `/api/health`; these are application reservations, not a provider invoice or account-wide hard cap. This source publication does not increase that allowance.

Review and explicitly authorize your own budget before enabling paid access. Budget settings are `LIVE_TOTAL_APPROVED_USD`, `LIVE_AGENTMART_BUDGET_USD` and `LIVE_PORTFOLIO_BUDGET_USD`. The validation supports fixed combined tiers and reserves development headroom. Do not reuse this project's approval as authorization for your own usage, reset an existing ledger, or create a fresh paid deployment to bypass existing reservations. Missing provider configuration leaves voice unavailable.


Configuration examples are in [.env.example](../.env.example). Provider keys must remain server-side. Never deploy the private parent repository or copy its environment values.
