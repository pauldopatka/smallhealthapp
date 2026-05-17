# Deferred Work

## From: Dashboard (spec-dashboard-widgets.md)

- **Trainings-Zyklus** — Dashboard-Widget das das nächste Training anzeigt. Zwei Modi (umschaltbar): (1) Warteschlange: Reihenfolge aus Templates, Abhaken → nächstes; (2) Feste Wochentage: z.B. Mo=Push, Mi=Pull, Fr=Legs. Eigene Firestore-Kollektion `trainingCycle`.

---

## From: Nutrition Tracker (spec-nutrition-tracker.md)

- **Claude Foto-Analyse** — Mahlzeit fotografieren, Claude analysiert automatisch Kalorien + Makros. Braucht serverless Proxy (Firebase Functions / Vercel Edge) für Anthropic API Key.
- **Makro-Ziele** — Separate Zielwerte für Protein/KH/Fett neben dem Kalorienziel.
- **Wochen-Chart** — 7-Tage-Balkendiagramm der täglichen Kalorien.
- **Mahlzeit löschen** — Einzelne Einträge entfernen.

---

## From: Workout Log (spec-workout-log.md)

- **Workout Plan / Templates** — Fester Wochenplan (z.B. Push/Pull/Legs). Zeigt oben auf der Workouts-Seite an, was als nächstes ansteht. Braucht eigene Firestore-Kollektion `workoutTemplates` und Logik für "nächstes anstehendes Workout".

---

## From: Login — Firebase Auth (spec-login-firebase-auth.md)

- **Post-login redirect to original route** — After login, user always lands on `/`. If they were redirected from e.g. `/weight`, they lose that context. Implement via `location.state.from` in ProtectedRoute + Login.tsx. (Low priority for single-user personal app)

- **signOut error handling** — `signOut()` in AuthContext returns a Promise with no error boundary at call site. When sign-out UI is built, caller must catch and surface failures to the user.

- **No 404 catch-all route** — Unknown paths render a blank page. Add `<Route path="*" element={<NotFound />} />` to App.tsx.

- **Google popup on mobile/iOS/PWA** — `signInWithPopup` unreliable in iOS Safari standalone mode and in-app browsers. Future: detect environment and fall back to `signInWithRedirect`.

- **Loading timeout** — `loading` stays `true` indefinitely if Firebase is misconfigured or unreachable. Future: add a 10s timeout that surfaces an error state.
