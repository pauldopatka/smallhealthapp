---
title: 'Weight Tracker — Log + Trend Chart with Period Filter'
type: 'feature'
created: '2026-05-17'
status: 'done'
baseline_commit: 'e218039'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Weight page is a placeholder. Users cannot track their body weight or see trends.

**Approach:** A minimal weight tracker: a quick-entry form at the top (weight + unit), a period selector (1W / 1M / 3M / 1J), a Recharts line chart showing the trend for the selected period, and a trend indicator (direction + delta vs. period start). All data stored in Firestore, real-time via onSnapshot.

## Boundaries & Constraints

**Always:**
- Data path: `users/{uid}/weightEntries/{entryId}` — fields: `weight: number`, `unit: 'kg' | 'lbs'`, `date: Timestamp`
- Unit selection is per entry and stored in Firestore.
- Date is auto-set to current timestamp on save (no date picker).
- Period filter (1W / 1M / 3M / 1J) filters the already-subscribed entries on the client — no additional Firestore queries.
- Chart uses Recharts `LineChart` + `ResponsiveContainer` (already installed).
- Trend indicator shows: delta vs. first entry in the period (e.g. "−1.2 kg seit 1 Monat") and a directional arrow (↓ losing, ↑ gaining, → stable within ±0.2).
- Subscribe to ALL entries ordered by date desc; the most recent entry determines the default unit shown in the input.

**Ask First:**
- Whether to add delete of individual entries (not in scope).

**Never:**
- No manual date picker.
- No editing of past entries.
- No unit conversion between kg and lbs (entries keep their original unit).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Log weight | Valid number + unit | Saved, appears in chart immediately | — |
| Empty weight input | Form submitted | Blocked by `required` + `min` validation | — |
| No entries in period | Period with no data | Chart hidden, "Keine Daten für diesen Zeitraum" message | — |
| No entries at all | Fresh account | Empty state: "Noch kein Gewicht eingetragen." | — |
| Firestore save fails | Network error | "Speichern fehlgeschlagen." below save button | — |
| Only one entry in period | Single data point | Chart shows single dot, no trend delta shown | — |

</frozen-after-approval>

## Code Map

- `src/types/weight.ts` — NEW: `WeightEntry` interface
- `src/lib/weight.ts` — NEW: `saveWeight`, `subscribeToWeightEntries`
- `src/pages/Weight.tsx` — REPLACE: full page with entry form, period tabs, chart, trend indicator

## Tasks & Acceptance

**Execution:**
- [x] `src/types/weight.ts` -- CREATE: `WeightEntry { id, weight, unit, date }`
- [x] `src/lib/weight.ts` -- CREATE: `saveWeight(uid, weight, unit)` using `addDoc + serverTimestamp`; `subscribeToWeightEntries(uid, callback)` using `onSnapshot` ordered by date asc
- [x] `src/pages/Weight.tsx` -- REPLACE: form (weight number input + kg/lbs toggle + save button), period tabs (1W/1M/3M/1J), Recharts line chart filtered to period, trend indicator

**Acceptance Criteria:**
- Given logged-in user with entries, when they open Weight, then entries load and chart renders for default period (1M)
- Given no entries, when user opens Weight, then "Noch kein Gewicht eingetragen." is shown
- Given user enters a weight and saves, when save succeeds, then entry appears in chart immediately
- Given user selects a period, when entries exist in that period, then chart updates to show only that range
- Given no entries in selected period, when period has no data, then chart is hidden and message shown
- Given ≥2 entries in period, when chart renders, then trend indicator shows delta vs. period start

## Design Notes

Period filter logic:
```ts
const periodDays = { "1W": 7, "1M": 30, "3M": 90, "1J": 365 };
const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - periodDays[period]);
const filtered = entries.filter(e => e.date?.toDate() >= cutoff);
```

Trend indicator:
```ts
const delta = filtered.last.weight - filtered.first.weight;
const arrow = Math.abs(delta) <= 0.2 ? "→" : delta < 0 ? "↓" : "↑";
const color = delta < 0 ? "text-emerald-400" : delta > 0 ? "text-red-400" : "text-gray-400";
```

Recharts config: `<LineChart>` with `<XAxis dataKey="dateLabel">`, `<YAxis domain={['auto','auto']}/>`, `<Line type="monotone" dot={false}/>`. Format `dateLabel` as short date string for the selected period.

## Verification

**Commands:**
- `pnpm build` -- expected: no TypeScript errors

**Manual checks:**
- Log 3 weights → chart shows line
- Switch period to 1W → filters correctly
- Select period with no data → message shown, chart hidden

## Suggested Review Order

**Daten & Filtering**

- WeightEntry Typ (Unit wiederverwendet aus workout.ts)
  [`weight.ts:1`](../../src/types/weight.ts#L1)

- subscribeToWeightEntries: asc sortiert für Chart; saveWeight mit serverTimestamp
  [`weight.ts:1`](../../src/lib/weight.ts#L1)

- cutoffDate + Period-Filter auf Client-Seite
  [`Weight.tsx:22`](../../src/pages/Weight.tsx#L22)

**Trend-Logik**

- delta, arrow und trendColor Berechnung
  [`Weight.tsx:57`](../../src/pages/Weight.tsx#L57)

**Chart**

- Recharts ResponsiveContainer + LineChart Konfiguration (dark theme, emerald)
  [`Weight.tsx:154`](../../src/pages/Weight.tsx#L154)

- dot nur bei ≤14 Punkten sichtbar (verhindert Unübersichtlichkeit bei langen Zeiträumen)
  [`Weight.tsx:183`](../../src/pages/Weight.tsx#L183)

## Spec Change Log
