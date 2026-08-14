# T8.4 — Offline verification

> Verify the install + offline behaviour end-to-end and capture evidence for the report.

| Field | Value |
|---|---|
| **Task ID** | T8.4 |
| **Milestone** | M8 — PWA & offline |
| **Status** | ☑ Done |
| **Priority** | P1 |
| **Estimate** | 0.5d |
| **Depends on** | T8.3 |
| **Blocks** | — |
| **Labels** | testing, pwa, offline |

## Context & rationale
NFR-U1 is a claim that must be demonstrated, not assumed (PRD §13). A short, repeatable verification
(and a screen recording/screenshots) is good report evidence and guards against regressions.

## Spec references
- PRD NFR-U1, FR-8, §13
- PROJECT-SPEC.md §5.5

## Implementation steps
1. Run a Lighthouse PWA audit (installable + offline checks) on the production build.
2. Manually verify: install → open offline → app shell loads → a previously viewed route opens.
3. Capture screenshots / a short clip for the README + report.
4. Note known limits (e.g. analysing a brand-new route needs network for uncached elevation).

## Acceptance criteria
- [ ] Lighthouse PWA checks pass (installable + offline).
- [ ] A previously viewed route demonstrably works offline.
- [ ] Evidence captured in `docs/` for the report.

## Definition of Done
- [ ] Code follows the layering rules in PROJECT-SPEC.md §3 (procedures thin · services pure · data layer owns Prisma/Mongo).
- [ ] `pnpm check-types` and `pnpm lint` pass (Husky pre-commit stays green).
- [ ] New/affected logic covered by Vitest; `pnpm test` green.
- [ ] Committed in small, dated, Conventional-Commit units (PROJECT-SPEC.md §12).
- [ ] Offline evidence saved under `docs/` (feeds T9.1/T9.8).

## Files & paths
- `docs/pwa-offline-evidence/` (screenshots/notes)

## WOOLF report mapping
- *Conclusion* — offline capability + limitations.

## Suggested commit(s)
- `test(pwa): offline verification + evidence`
