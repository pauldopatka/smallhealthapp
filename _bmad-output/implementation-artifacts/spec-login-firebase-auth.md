---
title: 'Login — Firebase Auth (Google + Email/Password)'
type: 'feature'
created: '2026-05-17'
status: 'done'
baseline_commit: 'b5c4835'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The app has no authentication. Any visitor can open it, and Firestore data cannot be scoped per user.

**Approach:** Add Firebase Auth with Google OAuth and Email/Password sign-in. All app routes are protected behind an `AuthContext` — unauthenticated users are redirected to `/login`. The Login page is the only public route.

## Boundaries & Constraints

**Always:**
- Use `onAuthStateChanged` for auth state — never read `auth.currentUser` directly on mount.
- Show a full-screen loading spinner while auth state is resolving (before first `onAuthStateChanged` emission).
- Use `signInWithPopup` for Google (not redirect).
- On successful login redirect to `/` (Dashboard).
- If already logged in and visiting `/login`, redirect to `/`.

**Ask First:**
- Whether email verification should be required after Email/Password registration.

**Never:**
- No "Forgot Password" flow in this spec.
- No username-only auth.
- No manual JWT handling.
- Don't store any auth tokens in localStorage.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Google login success | User completes OAuth popup | Logged in, redirected to `/` | — |
| Google popup cancelled | User closes popup | Stay on `/login`, no error shown | Swallow `auth/popup-closed-by-user` silently |
| Email login success | Valid credentials | Logged in, redirected to `/` | — |
| Wrong password | Invalid credentials | Inline error below form | Show Firebase error message (translated) |
| Email not registered | Unknown email + password | Inline error below form | Generic "E-Mail oder Passwort falsch" |
| Account exists with Google | Email tied to Google, tries password | Inline error | "Bitte melde dich mit Google an" |
| Unauthenticated page visit | Any route except `/login` | Redirect to `/login` | — |
| Auth state loading | App startup | Full-screen spinner | — |

</frozen-after-approval>

## Code Map

- `src/lib/firebase.ts` — exports `auth` (Auth instance) and `db` (Firestore)
- `src/App.tsx` — top-level router; needs AuthProvider wrap + ProtectedRoute on app routes
- `src/contexts/AuthContext.tsx` — NEW: provides `user`, `loading`, `signOut`
- `src/pages/Login.tsx` — NEW: public login page (Google button + email/password form)
- `src/components/ProtectedRoute.tsx` — NEW: redirects to `/login` if unauthenticated

## Tasks & Acceptance

**Execution:**
- [x] `src/contexts/AuthContext.tsx` -- CREATE: context with `user: User | null`, `loading: boolean`, `signOut: () => Promise<void>`; subscribe to `onAuthStateChanged` in useEffect; unsubscribe on cleanup
- [x] `src/pages/Login.tsx` -- CREATE: login page with Google sign-in button and email/password form; handle all edge cases from the I/O matrix; match dark theme (bg-gray-950, emerald accent)
- [x] `src/components/ProtectedRoute.tsx` -- CREATE: if loading → full-screen spinner; if no user → `<Navigate to="/login" replace />`; else → render children
- [x] `src/App.tsx` -- UPDATE: wrap entire tree with `<AuthProvider>`; add `<Route path="/login" element={<Login />} />` as public route; wrap all existing routes with `<ProtectedRoute>`; hide bottom nav when on `/login`

**Acceptance Criteria:**
- Given unauthenticated user, when they visit any route, then they are redirected to `/login`
- Given authenticated user, when they visit `/login`, then they are redirected to `/`
- Given app startup, when auth state has not yet resolved, then a full-screen spinner is shown
- Given user clicks "Mit Google anmelden", when they complete OAuth, then they land on Dashboard
- Given user submits valid email + password, when login succeeds, then they land on Dashboard
- Given user submits wrong credentials, when login fails, then an inline error appears below the form
- Given user closes the Google popup, when the popup closes, then no error is shown and the user stays on `/login`
- Given authenticated user, when they are inside the app, then the bottom nav is visible

## Design Notes

AuthContext shape:
```tsx
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}
```

ProtectedRoute pattern:
```tsx
if (loading) return <FullScreenSpinner />;
if (!user) return <Navigate to="/login" replace />;
return <>{children}</>;
```

Map Firebase error codes to German user-facing strings in a small `authErrorMessage(code)` helper inside `Login.tsx`.

## Verification

**Commands:**
- `pnpm build` -- expected: no TypeScript errors, clean build

**Manual checks:**
- Open `http://localhost:5173` while logged out → redirected to `/login`
- Google login flow completes → lands on Dashboard, bottom nav visible
- Submit wrong password → inline error appears, no redirect
- Close Google popup → no error shown
- Refresh while logged in → stays on current page (auth persists via Firebase)

## Suggested Review Order

**Auth State Foundation**

- Central auth state; onAuthStateChanged subscriber with cleanup — entry point for the whole design
  [`AuthContext.tsx:1`](../../src/contexts/AuthContext.tsx#L1)

- Loading gate in AppLayout — guards ProtectedRoute from ever rendering while auth unresolved
  [`App.tsx:32`](../../src/App.tsx#L32)

**Route Protection**

- ProtectedRoute: lean by design — redirect only, loading handled by parent
  [`ProtectedRoute.tsx:4`](../../src/components/ProtectedRoute.tsx#L4)

- Route layout: /login public, all five app routes wrapped in ProtectedRoute
  [`App.tsx:44`](../../src/App.tsx#L44)

- isLoginPage check hides header and nav on the login screen
  [`App.tsx:30`](../../src/App.tsx#L30)

**Login UI & Error Handling**

- authErrorMessage: Firebase codes → German user-facing strings (incl. popup-blocked, network)
  [`Login.tsx:12`](../../src/pages/Login.tsx#L12)

- handleGoogle: popup flow, silenced codes (popup-closed + cancelled-popup-request)
  [`Login.tsx:43`](../../src/pages/Login.tsx#L43)

- handleEmailSubmit: register/login branching, error extraction pattern
  [`Login.tsx:55`](../../src/pages/Login.tsx#L55)

- Redirect-if-logged-in guard at top of Login render
  [`Login.tsx:41`](../../src/pages/Login.tsx#L41)

**Config & Security**

- Firebase init — hardcoded config (web-public by design), exports auth + db
  [`firebase.ts:1`](../../src/lib/firebase.ts#L1)

- Firestore rules: user-scoped read/write under users/{userId}/**
  [`firestore.rules:7`](../../firestore.rules#L7)

## Spec Change Log
