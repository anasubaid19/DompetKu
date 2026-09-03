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
- Use `PageHeader` from `src/components/page-header.tsx` on app pages.
- Default inputs, selects, and primary buttons are 44px high (`h-11`) with `rounded-xl`.
- Use `Select` from `src/components/ui/select.tsx`; it owns the custom chevron and normalized native appearance.
- Use `SegmentedControl` from `src/components/ui/segmented-control.tsx`; its pill-tray appearance is intentional.
- Use `FormField` for labels and hints. Keep form controls full-width unless a compact grid is explicitly required.
- Preserve keyboard focus styles, semantic labels, 44px coarse-pointer targets, and mobile bottom-navigation clearance.

## Current State

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

Latest result: all commands passed; tests reported 5 passed, 0 failed, and 14 assertions.

For UI changes, also inspect desktop and mobile layouts in both themes, including dialogs and the fixed mobile navigation.

## Repository Note

- The repository currently has no commits and its project files are untracked. Do not assume `git diff` shows the working implementation; inspect files directly and avoid destructive git commands.
- Never commit credentials, local databases, exported session transcripts, or backup JSON files.
