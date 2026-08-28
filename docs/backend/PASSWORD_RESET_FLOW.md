# Password Reset Flow

### 1. Email Link → Callback Route (`/auth/callback`)
When the user clicks the reset link in their email, the link directs to `/auth/callback?token_hash=...&type=recovery&next=/auth/reset-password`. The callback route:
- Verifies the one-time token hash via `supabase.auth.verifyOtp({ token_hash, type })` (or exchanges PKCE `code` via `exchangeCodeForSession(code)`)
- Establishes a verified **recovery session**
- Redirects to `/auth/reset-password?verified=true`

If the token/code is invalid, expired, or missing, it redirects to login with `?error=invalid_reset_link`.

---

### 2. Middleware (`proxy`)
Before the request even hits the page, middleware checks:
- `/auth/reset-password` is in `authOnlyRoutes`, so **unauthenticated users** (no session at all) get redirected to login immediately
- This blocks the "manually typed url" case

---

### 3. Reset Password Page
For users who **do** have a session, the page runs two checks:

**Check 1: `getUser()`**
Validates the session server-side against Supabase. If there's no valid user, redirect to login. This is the secure check — `getUser()` hits the Supabase server, it can't be spoofed with a tampered cookie.

**Check 2: AMR (Authentication Method Reference)**
`getSession()` returns the JWT access token. `decodeJwt()` cracks open the JWT payload and reads the `amr` array, which Supabase embeds to describe *how* the session was created. A recovery session has:
```json
[{ "method": "recovery", "timestamp": 1776302185 }]
```
A normal password login would have `{ "method": "password" }` instead. If `isRecovery` is false, the user gets redirected away — they can't access the form even with a valid normal session.

---

## Why Each Piece Is Necessary

| Scenario | Blocked By |
|---|---|
| No session, types bare URL | Middleware |
| Normal logged-in user types bare URL | AMR check on page |
| Uses expired/invalid reset link | Callback rejects bad code |
| Valid recovery session | Allowed through |

---
