---
title: 'Dashboard — Weight Widget + Calorie & Macro Ring Charts'
type: 'feature'
created: '2026-05-17'
status: 'done'
baseline_commit: 'e985905'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Dashboard is a placeholder. Users have no overview of their daily progress.

**Approach:** Three widgets on the Dashboard: (1) a large calorie ring showing today's consumed vs. goal, (2) three smaller macro rings (Protein / Kohlenhydrate / Fett) derived from the calorie goal, (3) a weight card showing the most recent entry and the delta vs. 7 days ago. All data from existing Firestore collections — no new data model.

## Boundaries & Constraints

**Always:**
- Read today's meals: `where("dateKey", "==", toDateKey(new Date()))` from `mealEntries`.
- Read calorie goal: `nutritionSettings/default`.
- Read weight entries: all from `weightEntries` ordered by date asc — last entry is current weight; compare to first entry within last 7 days for delta.
- Macro goals are **derived** from the calorie goal, not stored separately:
  - Protein: `calorieGoal × 0.30 ÷ 4` grams
  - Kohlenhydrate: `calorieGoal × 0.45 ÷ 4` grams
  - Fett: `calorieGoal × 0.25 ÷ 9` grams
- Rings are custom SVG circles (no Recharts needed for rings).
- If no calorie goal set: show "Kalorienziel fehlt" with link to Ernährung page.
- If no weight entries: hide weight widget.
- Calorie ring color: emerald ≤100%, amber 100–115%, red >115%.
- Macro ring color: matching the nutrition page (blue = protein, yellow = carbs, orange = fat).

**Never:**
- No writing to Firestore from the Dashboard.
- No training cycle widget in this spec (deferred).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior |
|----------|--------------|---------------------------|
| No goal, no entries | Fresh account | "Kalorienziel fehlt" placeholder + empty weight area |
| Goal set, no meals today | 0 kcal consumed | Rings empty (0%), "0 / 2500 kcal" label |
| Over goal | >100% ratio | Ring fills to 100%, color turns red |
| No weight entries | — | Weight widget hidden |
| Only one weight entry | No 7-day comparison | Show current weight, no delta |

</frozen-after-approval>

## Code Map

- `src/pages/Dashboard.tsx` — REPLACE: full page with three widgets
- `src/components/RingChart.tsx` — NEW: reusable SVG circular progress component
- `src/lib/weight.ts` — existing: reuse `subscribeToWeightEntries`
- `src/lib/nutrition.ts` — existing: reuse `subscribeToMeals` + `subscribeToGoal`

## Tasks & Acceptance

**Execution:**
- [x] `src/components/RingChart.tsx` -- CREATE: SVG ring with props `value, max, color, size, label, sublabel`; shows filled arc proportional to value/max; center text shows label + sublabel
- [x] `src/pages/Dashboard.tsx` -- REPLACE: three subscriptions (goal, today's meals, weight entries); render calorie ring, 3 macro rings, weight card

**Acceptance Criteria:**
- Given goal is set and meals logged, when Dashboard loads, then calorie ring shows consumed/goal with correct color
- Given goal set, when macros are logged, then 3 macro rings show consumed vs. derived goal
- Given weight entries exist, when Dashboard loads, then weight card shows current weight and delta vs. 7 days ago
- Given no goal set, when Dashboard loads, then "Kalorienziel fehlt" is shown with link to Ernährung
- Given no weight entries, when Dashboard loads, then weight widget is not rendered

## Design Notes

RingChart SVG pattern (r=26, size=64px by default):
```tsx
const circumference = 2 * Math.PI * r;
const filled = Math.min(value / max, 1);
const offset = circumference * (1 - filled);
// Two circles: background track + colored arc (rotated -90deg to start at top)
```

Dashboard layout:
```
┌─────────────────────────────┐
│  Guten Tag, FitTrack 💪      │
├──────────────┬──────────────┤
│  Kalorien    │  Gewicht     │
│  (big ring)  │  (card)      │
├──────────────┴──────────────┤
│  Protein │ Kohlenhydrate │ Fett │
│  (rings) │   (rings)     │(ring)│
└─────────────────────────────┘
```

Weight delta: `delta = currentWeight - weightSevenDaysAgo`; display as `↓ 0.8 kg` or `↑ 1.2 kg` with color.

## Verification

**Commands:**
- `pnpm build` -- expected: no TypeScript errors

**Manual checks:**
- Log a meal (Ernährung) → Dashboard calorie ring updates
- Log a weight → weight card appears with current value
- Exceed calorie goal → ring turns red

## Spec Change Log
