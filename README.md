# Oro Pageant Voting Platform

**Created by Rawali Irurapa ([@raapaar](https://github.com/raapaar))**

A working web application for an Oro Province pageant, with contestant profiles, a vote leaderboard and a protected organiser dashboard.

[Live demo](https://oro-pageant-2026.mossy-joy-4772.chatgpt.site/) · [Leaderboard](https://oro-pageant-2026.mossy-joy-4772.chatgpt.site/leaderboard)

> Development status: public practice preview. Official voting and payments are disabled while event requirements are being finalised.

Oro Province pageant foundation built with React, TypeScript, Vinext, Cloudflare Workers, D1 and Drizzle. Permanent hosted address: https://oro-pageant-2026.mossy-joy-4772.chatgpt.site. No custom domain is required.

## Visitor experience
- Responsive contestant directory, Ijivitari/Sohe filtering, search, profile dialogs, practice vote confirmation, receipts and profile sharing.
- Original butterfly artwork and labelled placeholder portraits; no invented real contestant names or vote tallies.
- Homepage and `/leaderboard` show the current public practice round. Standings refresh every 15 seconds, tied totals share a competition rank, and zero-vote contestants stay unranked. Failed refreshes explicitly mark previously loaded standings as stale.
- One practice ballot per authenticated account per event revision, enforced by an atomic insert and a database unique index. Official ballots and payments are disabled.
- Public pages and aggregate standings can be viewed without signing in. Practice voting uses platform-owned ChatGPT sign-in.
- Facebook metadata includes a 1200×630 PNG share card. Validate the public link with Facebook Sharing Debugger before promoting the event.

## Administrator
`/admin` uses platform-owned ChatGPT sign-in. The server checks the authenticated email against the secret runtime `ADMIN_EMAIL`. Unset or blank configuration denies all management access. Configure this value through hosted runtime settings; never put it in source or client code. Sites dispatch supplies verified identity headers.

The dashboard provides event and contestant editing, private draft preview, shared lineup publication, and aggregate leaderboard CSV export. `/studio`, private draft reads/writes, private draft practice votes and `/api/admin/publish` require the administrator identity. Visitors cannot grant themselves access.

Save an event in `/studio`, review it at `/?preview=draft`, then use **Publish saved draft** in `/admin`. Saving never changes the public event. Publication validates the saved draft and atomically advances the shared event revision. Each new public revision starts a fresh practice round. Historical practice ballots are preserved separately. Until a lineup is published, visitors see the labelled sample lineup.

The studio supports validated JSON import/export and HTTPS portrait URLs. Direct image uploads are not enabled. Contestant IDs must be unique. Write endpoints enforce same-origin requests and bounded JSON input. CSV cells are escaped to prevent formula injection.

## Development and verification
Node >=22.13.0 and pnpm. Use `npm run dev` and `npm run build` after installing dependencies. Hosted provisioning reads the `DB` binding in `.openai/hosting.json` and applies committed D1 migrations during publication. See `docs/LOCAL_DEVELOPMENT.md` for local setup and migration commands.

Checks:
- `npx tsc --noEmit`
- `node tests/leaderboard-policy.mjs` — ranking, ties, zero votes, percentages and fail-closed admin policy.
- `python tests/database-integrity.py` — actual migrations, concurrent uniqueness and revision separation.
- After building: `node --import ./scripts/sites-env.mjs tests/worker-integration.mjs` — production Worker and real local D1 binding, without an HTTP server. Verifies login-page rendering, admin/visitor authorization, CSRF, protected drafts, shared publication, official-ballot rejection, eight concurrent attempts producing one vote, leaderboard counts and preserved round history. Identity is simulated only inside this isolated test runtime; this does not exercise the external OAuth provider.

Generate new schema migrations with `npm run db:generate`. Never edit already-applied SQL or migration metadata.

## Event data and official voting
Still needed: event name, approved portraits and biographies, date/venue, organiser contact/privacy notice, free or paid voting, eligibility, voter verification, limits, voting window, tally visibility, and tie handling. Before official voting, implement and test the agreed verification/anti-abuse policy, server-enforced opening/closing times, audit/reporting and retention. Account-based duplicate prevention does not prove one person. No payment credentials or integration are configured.

## Reference
Conceptual inspiration: https://github.com/iamomehdave/CloudTech-PageantVotingSystem — contestant discovery, voting flow and organiser management. The PHP/Laravel and Paystack code was not copied; this is a new Cloudflare-oriented implementation.

## Contributing

Suggestions, reproducible bug reports, accessibility improvements and focused pull requests are welcome. Open an issue describing the change before starting a substantial feature. Never include real voter records, credentials or private event data in issues or pull requests.

## Repository and hosting

This repository contains a clean source snapshot. The live deployment is managed separately; publishing a GitHub commit does not automatically redeploy the site. The original hosting project ID has been removed from the public source. The `.openai/hosting.json` file retains only logical storage binding names. A new deployment needs its own hosting project and runtime configuration. Local development can use the starter’s loopback-only mock identity, as described in `docs/LOCAL_DEVELOPMENT.md`.
