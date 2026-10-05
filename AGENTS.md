# DompetKu Agent Handoff

## Project

- Use Bun for installs, scripts, tests, and runtime commands.
- Stack: TanStack Start, React 19, Tailwind CSS v4, Base UI, Hugeicons, Recharts, Better Auth, and SQLite through `bun:sqlite`.
- Preserve the current minimal visual identity: light/dark themes, purple/lavender accent, rounded surfaces, and restrained motion.
- Prefer existing shared components and the smallest root-cause change. Do not add dependencies or redesign screens unless requested.
- Do not change finance behavior, API contracts, authentication, or database structure for UI-only work.
- Communicate with the user in Indonesian.

## UI Standards

- Main content and desktop header use `max-w-[1200px]` with matching horizontal padding in `src/components/app-shell.tsx`.
- The mobile bottom navigation is an icon-only dock (no text labels): a floating frosted tray of 44px tiles, active tile filled with `primary`, hover lift only on `pointer-fine` devices, and `aria-label` + `aria-current` per link.
- Use `PageHeader` from `src/components/page-header.tsx` on app pages.
- Default inputs, selects, and primary buttons are 44px high (`h-11`) with `rounded-xl`.
- Use `Select` from `src/components/ui/select.tsx`; it owns the custom chevron and normalized native appearance.
- Use `SegmentedControl` from `src/components/ui/segmented-control.tsx`; its pill-tray appearance is intentional.
- Use `FormField` for labels and hints. Keep form controls full-width unless a compact grid is explicitly required.
- Preserve keyboard focus styles, semantic labels, 44px coarse-pointer targets, and mobile bottom-navigation clearance.

## Current State

Completed on 2026-10-05:

- E2E smoke test run in a real browser (scratch DB): wallet, quick-add, budget, debt installment, subscription payment, reports (donut/trend/calendar), and settings all work with zero console errors; the earlier hydration bug is confirmed fixed.
- Added per-wallet budgets (new additive `wallet_budgets` table + `createWalletBudget`/`deleteWalletBudget`) shown under Rencana > Anggaran, and a spending calendar (daily expense heat grid) on Laporan.
- Added `.github/workflows/ci.yml` running check/typecheck/test/build, and removed the unused legacy root `index.html`.
- Mobile quick-add and recurring income (batch 2): a floating "+" action on Ringkasan opens the transaction dialog (`TransactionDialog` gained a `fab` prop); Ringkasan shows an active-debt summary; and Rutin supports recurring **income** via a new additive `subscriptions.direction` column (`'expense'` default), with `paySubscription` direction-aware. Migration verified on a copy of the real database (identical row counts).
- Reports/insights batch: added a category donut to "Pengeluaran terbesar", a "Perbandingan siklus ini" card (income/expense delta vs the previous cycle and vs the 3-cycle average, plus the top expense increases), and an "Anggaran hampir penuh" card on Ringkasan (budgets at 80%+). All read-only, no schema change. Category chart colors come from `categoryChartColor()` in `finance-options.ts`.

Completed on 2026-10-04:

- Backup restore now reports results: `importFinanceData` refactored into `parseBackupJson` + `restoreFinanceData` (both unit-testable) and returns imported/skipped counts per table; the Pengaturan card shows a "Hasil pemulihan terakhir" summary. Subscription `interval_months` now survives import. Round-trip verified against a copy of the real database (all row counts and balances identical).
- Redesigned the mobile bottom navigation as an icon-only dock inspired by opensourceui's App Dock: a floating frosted tray with 44px tiles, active tile filled with `primary`, hover lift/scale only on `pointer-fine` devices, no text labels, and `aria-label` + `aria-current` for accessibility.
- Rewrote user-facing copy in plain Indonesian (better-writing) on the landing page, app headers, auth, help, and meta; aligned the term "Budget" → "Anggaran", and used an en dash for cycle ranges (better-typography).
- Added a custom pull-to-refresh for the app pages (`src/components/pull-to-refresh.tsx`, mounted in `AppShell`): pulling down at the top of a page shows a progress spinner with a "release to reload" cue and re-runs the route loader via `router.invalidate()`. Skips gestures inside dialogs and scrollable widgets, honours reduced motion, and sets `overscroll-behavior-y: contain` while mounted. Built for the standalone PWA where the native gesture is unreliable.
- P2-P7 shipped. P2: Langganan can be paid from a wallet (`paySubscription` posts a linked expense, advances `next_due_date` by `interval_months`, and the interval is editable). P3: debt due-soon badges plus an overdue-reminder card on Ringkasan. P4: "Urungkan" in the delete toasts for transactions, wallets, debts, budgets, and subscriptions. P5: net-worth trend chart on Laporan. P6: debt details (contact/due date/note) are editable via `updateDebt`. P7: search across Rencana.
- Schema changes are additive only: `subscriptions.interval_months INTEGER NOT NULL DEFAULT 1` via a guarded `ALTER TABLE ADD COLUMN`. Verified on a copy of the real database: identical row counts before/after.
- Closed the planning CRUD gap: Budget, Tabungan, and Langganan can now be edited and deleted (new `updateSaving`/`deleteSaving`, `deleteBudget`, `updateSubscription`/`deleteSubscription`), with edit dialogs and delete confirmations on the Rencana page. Tabungan/langganan deletions keep already-posted transactions.
- UI/UX pass (better-interface review, findings #1-#9): visible keyboard focus on `SegmentedControl`; `aria-current="page"` on both navs; success/warning tokens darkened to clear WCAG AA (success 5.43:1, warning 3.47:1 as icon); transaction type badges show Indonesian labels; debt delete label follows the debt type; all money inputs now use the shared `MoneyInput` (thousands formatting + `inputMode="numeric"`); Reports chart no longer uses a negative left margin; planning card headings step down from section headings.
- Fixed shared progress bars rendering smaller than the stated percentage by removing the manual indicator transform and relying on Base UI width. Also hardened the mobile Ringkasan layout against horizontal overflow around the cash-flow chart and long currency values.
- Fixed persistent mobile horizontal overflow app-wide (verified at 390px with adversarial data: zero overflowing elements on all five pages). Root causes: auto grid tracks sized by `truncate`/nowrap max-content, and `CategoryLabel`/`WalletLabel` whose outer `min-w-0` alone could not shrink them. Fix: `grid-cols-1` on page roots and single-column grids, `min-w-0` on cards/rows/items (including shared `Card` base), and `max-w-full` + inner `min-w-0` on the shared labels.
- Connected debt payments to wallets: cicil/lunas creates linked income/expense transactions in seeded "Bayar Hutang"/"Piutang Dibayar" categories via new `recordDebtPayment`/`settleDebt`/`reopenDebt` server functions plus a `debt_id` transaction column; tambah supports an optional wallet instead of a popup gate.

Completed on 2026-10-04:

- Debt cards on Rencana > Hutang & piutang are now clickable and open a management dialog with four actions: Tandai lunas, Tambah hutang, Cicil hutang, and Hapus hutang. Cards show the remaining amount (plus a progress bar when partially paid) instead of a single toggle button. New server functions: `addDebtAmount`, `payDebtInstallment`, `deleteDebt`, and a tested `nextDebtState` helper. Cicil auto-marks a debt paid when installments reach the full amount; Tambah re-activates a settled debt when the amount grows.

Completed on 2026-09-02:

- Unified dropdown appearance app-wide in `src/components/ui/select.tsx` with `appearance-none`, consistent padding, and `ChevronDownIcon`.
- Stacked Mata uang, Tanggal mulai siklus, and Rentang laporan as equal full-width fields in `src/routes/_app/settings.tsx`.
- Kept the Transaksi type filter as a segmented pill-tray by user decision.
- Previously consolidated page headers, selects, segmented controls, and the 1200px application grid across Ringkasan, Transaksi, Rencana, Laporan, and Pengaturan.
- Visual QA passed at 1440x1000 and 390x844 in light/dark themes. Inputs, selects, and segmented controls measured 44px high with matching `rounded-xl`; no horizontal overflow was found.
- Minor contextual differences in avatar sizes, empty-state detail, and semantic badge colors were reviewed and intentionally left unchanged.

## Verification

Run after relevant changes:

```bash
bun run check
bun run typecheck
bun test
bun run build
```

Latest result: all commands passed; tests reported 16 passed, 0 failed, and 59 assertions.

For UI changes, also inspect desktop and mobile layouts in both themes, including dialogs and the fixed mobile navigation.

## Editing Rules

Exact-match edits (`oldString`) fail whenever the text is not copied verbatim from the file's current bytes. Root causes seen here: prior `bun run fix` reformatting, re-indentation by an earlier edit, memory-constructed text, and repeated lines that make a short `oldString` non-unique (`finance.functions.ts` has e.g. `.handler(async ({ data }) => {` 26 times).

- `read` the exact region immediately before each `edit`, and copy `oldString` verbatim (strip the line-number prefix).
- Treat every earlier read as stale after `bun run fix`, a formatter, or any edit touching nearby lines.
- Keep `oldString` short but unique by including one distinctive adjacent line; never target a bare repeated line.
- For whitespace-sensitive regions, run `scripts/peek.sh <file> <start> <end>` to print exact lines and flag trailing whitespace.
- Run `bun run fix` once at the end of an edit batch, not between edits you still need to match.

## Server-only Code

Files ending in `.server.ts` are import-protected by TanStack Start, so the client gets a stub instead of the module. Keep anything that touches `bun:sqlite` there.

- Do not add a plain (non-`createServerFn`) export that uses `db` to a module that client routes import (e.g. `finance.functions.ts`). Vite dev does not tree-shake, so `bun:sqlite` leaks into the client, hydration breaks, and every client interaction (dialogs, forms, pull-to-refresh) silently stops working. Put such helpers in a `.server.ts` module and load them with `await import()` inside the server-function handler.
- The Better Auth instance lives in `auth.server.ts` for this reason; route `src/routes/api/auth/$.ts` imports it from there.

## Repository Note

- The repository has commits and a GitHub remote (`origin`). Inspect files directly for the working state; avoid destructive git commands.
- Never commit credentials, local databases, exported session transcripts, or backup JSON files.
