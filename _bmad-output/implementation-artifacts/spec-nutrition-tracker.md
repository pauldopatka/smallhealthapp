---
title: 'Nutrition Tracker — Daily Meal Log with Calories, Macros and Goal'
type: 'feature'
created: '2026-05-17'
status: 'done'
baseline_commit: 'e4f147a'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Nutrition page is a placeholder. Users cannot track meals, calories or macros.

**Approach:** A daily nutrition tracker with day navigation (◀ / ▶). Users set a daily calorie goal once. Each day shows a progress bar (calories consumed vs. goal), a macro summary (Protein / Kohlenhydrate / Fett in grams), and a list of logged meals. A quick-entry form adds meals with name + calories + optional macros.

## Boundaries & Constraints

**Always:**
- Meal data path: `users/{uid}/mealEntries/{id}` — fields: `name, calories, protein, carbs, fat, date: Timestamp, dateKey: string (YYYY-MM-DD)`
- Goal data path: `users/{uid}/nutritionSettings/default` — field: `calorieGoal: number`
- `dateKey` is set on save as `YYYY-MM-DD` in local time; used for day-based Firestore query (`where("dateKey", "==", key)`).
- Default view is today. Day navigation changes `selectedDate` state; re-subscribes meals for the new day.
- Protein, carbs, fat default to 0 if left blank (optional inputs).
- Calorie goal is set inline on the page (edit icon next to goal display). Persisted to Firestore with `setDoc(..., { merge: true })`.
- Progress bar color: green ≤100% of goal, amber 100–115%, red >115%.

**Ask First:**
- Whether to add macro goals (not in scope — calories goal only for now).
- Whether to add delete of individual meals (not in scope).

**Never:**
- No food database / barcode / API in this spec (deferred: Claude photo analysis).
- No weekly chart in this spec.
- No editing past meals.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Add meal (calories only) | Name + calories, macros blank | Saved with protein/carbs/fat = 0 | — |
| Add meal (full macros) | All fields filled | Saved, totals update immediately | — |
| No meals today | Empty day | "Noch keine Mahlzeiten heute." | — |
| No goal set | calorieGoal not in Firestore | Progress bar hidden, "Kalorienziel setzen" prompt shown | — |
| Navigate to past day | ◀ pressed | Meals for that day load, future button (▶) becomes available | — |
| Navigate to future | ▶ on today | Button disabled (can't navigate past today) | — |
| Save meal fails | Network error | "Speichern fehlgeschlagen." below form | — |
| Calories input zero or negative | val ≤ 0 | Blocked by `min={1}` + `required` | — |

</frozen-after-approval>

## Code Map

- `src/types/nutrition.ts` — NEW: `MealEntry`, `NutritionGoal` interfaces
- `src/lib/nutrition.ts` — NEW: `saveMeal`, `subscribeToMeals`, `saveGoal`, `subscribeToGoal`
- `src/pages/Nutrition.tsx` — REPLACE: full page with day nav, goal bar, macro summary, meal list, add form

## Tasks & Acceptance

**Execution:**
- [x] `src/types/nutrition.ts` -- CREATE: `MealEntry { id, name, calories, protein, carbs, fat, date, dateKey }`, `NutritionGoal { calorieGoal: number }`
- [x] `src/lib/nutrition.ts` -- CREATE: `saveMeal(uid, dateKey, data)`; `subscribeToMeals(uid, dateKey, cb)` using `onSnapshot + where`; `saveGoal(uid, goal)`; `subscribeToGoal(uid, cb)` using `onSnapshot` on single doc
- [x] `src/pages/Nutrition.tsx` -- REPLACE: day navigation header (◀ date ▶), calorie progress bar with goal, macro row (P/C/F totals), meal list, add-meal form toggle

**Acceptance Criteria:**
- Given no goal set, when user opens Nutrition, then "Kalorienziel setzen" prompt is shown instead of progress bar
- Given goal is set, when meals are logged, then progress bar shows consumed/goal with correct color
- Given user adds a meal (calories only), when saved, then it appears in the list and totals update
- Given user navigates to a previous day, when ◀ is pressed, then meals for that day load
- Given today is selected, when user tries to navigate forward, then ▶ is disabled
- Given no meals for the selected day, when the day loads, then empty state is shown

## Design Notes

`dateKey` helper:
```ts
function toDateKey(d: Date): string {
  return d.toLocaleDateString("sv-SE"); // "2026-05-17" — sv-SE locale gives ISO format
}
```

Day navigation:
```ts
const [selectedDate, setSelectedDate] = useState(new Date());
const isToday = toDateKey(selectedDate) === toDateKey(new Date());
function prevDay() { setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate()-1); return n; }); }
function nextDay() { if (!isToday) setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate()+1); return n; }); }
```

Re-subscribe meals when `selectedDate` changes — `useEffect` depends on `[uid, dateKey]`.

Progress bar: `Math.min((consumed / goal) * 100, 100)` for bar width; color classes based on ratio.

Macro cards: three equal-width tiles (Protein / Kohlenhydrate / Fett) showing total grams for the day.

## Verification

**Commands:**
- `pnpm build` -- expected: no TypeScript errors

**Manual checks:**
- Set calorie goal → progress bar appears
- Add meal (e.g. "Oats, 350 kcal, P:10 C:60 F:5") → appears in list, bar updates
- Navigate ◀ → previous day loads; ▶ disabled on today

## Spec Change Log
