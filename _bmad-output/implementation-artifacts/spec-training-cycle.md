---
title: 'Training Cycle — Dashboard Widget with Queue and Weekday Modes'
type: 'feature'
created: '2026-06-24'
status: 'done'
baseline_commit: '61b2be8'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Users have no guidance on what to train next. They must manually remember their workout rotation.

**Approach:** A training cycle system on the Dashboard. Users pick from two modes: (1) Queue — an ordered list of templates that rotates; checking off advances to the next. (2) Weekday — templates assigned to specific days; checking off marks today as done. A configuration UI below the widget lets users create and switch their cycle. The widget shows the next scheduled workout and an "Abhaken" button.

## Boundaries & Constraints

**Always:**
- Data path: `users/{uid}/trainingCycle/config` — single document with fields: `mode: 'queue' | 'weekday'`, `entries: [{ templateId, templateName, dayOfWeek?: number }]`, `currentIndex: number`, `lastCompletedDate: string (YYYY-MM-DD)`.
- `dayOfWeek` uses 0=Sonntag … 6=Samstag. Only set in weekday mode.
- **Queue next:** `entries[currentIndex]`. After check-off: `currentIndex = (currentIndex + 1) % entries.length`.
- **Weekday next:** find the entry matching today's `dayOfWeek`. If none today, show the next upcoming entry (wrap to next week). After check-off: set `lastCompletedDate = todayKey`.
- Check-off is idempotent per day — if `lastCompletedDate === todayKey`, the "Abhaken" button is replaced with "✓ Erledigt" (disabled).
- Configuration section is collapsible below the widget, toggled by "Zyklus bearbeiten".
- Templates for the config dropdown come from the existing `workoutTemplates` collection.
- `useNavigate('/workouts')` link under the widget text to jump to the Workouts page.

**Ask First:**
- Whether to auto-start a workout from the template (cross-page). Not in scope — user navigates manually.

**Never:**
- No new Firestore collections besides the single `trainingCycle/config` doc.
- No editing of individual entries — reconfigure the whole cycle.
- No workout auto-creation from Dashboard.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| No cycle configured | No `config` doc | "Kein Trainingsplan. Erstelle deinen Zyklus!" with open config UI | — |
| Queue mode, 3 entries | currentIndex=1 | Shows entry[1] as next | — |
| Queue check-off | User clicks "Abhaken" | currentIndex advances, button shows "✓ Erledigt" | — |
| Weekday, today is Monday | Monday entry exists | Shows Monday's template | — |
| Weekday, today has no entry | No entry for today | Shows next upcoming day's template with day label | — |
| Weekday check-off | User clicks "Abhaken" | lastCompletedDate set to today, button disabled | — |
| Already checked off today | lastCompletedDate === today | "Abhaken" replaced with "✓ Erledigt" (disabled) | — |
| No templates exist | Empty workoutTemplates | Config shows "Erstelle zuerst ein Template auf der Workouts-Seite." | — |
| Cycle save fails | Network error | "Speichern fehlgeschlagen." | — |

</frozen-after-approval>

## Code Map

- `src/types/trainingCycle.ts` — NEW: `CycleConfig`, `CycleEntry` interfaces
- `src/lib/trainingCycle.ts` — NEW: `saveCycleConfig`, `subscribeToCycle`, `checkOffWorkout`
- `src/components/TrainingCycleWidget.tsx` — NEW: shows next workout + check-off + collapsible config
- `src/pages/Dashboard.tsx` — UPDATE: add widget above calorie/weight row

## Tasks & Acceptance

**Execution:**
- [x] `src/types/trainingCycle.ts` -- CREATE: `CycleEntry { templateId, templateName, dayOfWeek?: number }`, `CycleConfig { mode, entries, currentIndex, lastCompletedDate }`
- [x] `src/lib/trainingCycle.ts` -- CREATE: `saveCycleConfig(uid, config)` using `setDoc`; `subscribeToCycle(uid, cb)` using `onSnapshot`; `checkOffWorkout(uid, config)` that advances index (queue) or sets lastCompletedDate (weekday)
- [x] `src/components/TrainingCycleWidget.tsx` -- CREATE: widget with next-workout display, "Abhaken" button, "→ Zum Training" link, collapsible config section with mode toggle, template picker, weekday assignment
- [x] `src/pages/Dashboard.tsx` -- UPDATE: add `<TrainingCycleWidget />` between greeting and calorie/weight row; subscribe to templates for config dropdown

**Acceptance Criteria:**
- Given no cycle configured, when Dashboard loads, then "Kein Trainingsplan" is shown with config UI prompt
- Given queue mode with entries, when Dashboard loads, then next template name is displayed
- Given user clicks "Abhaken" in queue mode, when check-off succeeds, then currentIndex advances and button shows "✓ Erledigt"
- Given weekday mode with today's entry, when Dashboard loads, then today's template is shown
- Given weekday mode with no entry today, when Dashboard loads, then the next upcoming day's template is shown with day label
- Given already checked off today, when Dashboard loads, then button is disabled with "✓ Erledigt"
- Given user configures a new cycle (mode + templates), when saved, then widget updates immediately

## Design Notes

Next-workout resolution for weekday mode:
```ts
const today = new Date().getDay(); // 0-6
const sorted = entries
  .map((e, i) => ({ ...e, dist: (e.dayOfWeek! - today + 7) % 7 }))
  .sort((a, b) => a.dist - b.dist);
const next = sorted[0]; // closest upcoming (0 = today)
```

Config UI layout: mode toggle (two buttons: "Warteschlange" / "Wochentage"), then a list of template slots. In weekday mode each slot gets a day-of-week `<select>`. An "+" button adds a slot from a template dropdown.

Day names array: `["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]`.

## Verification

**Commands:**
- `pnpm build` -- expected: no TypeScript errors

**Manual checks:**
- Create a queue cycle: Push → Pull → Legs → check off twice → shows Legs
- Switch to weekday mode: assign Monday=Push, Wednesday=Pull → on Monday shows Push
- Check off → button disabled for today

## Spec Change Log
