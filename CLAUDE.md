# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Convoy Management System: users register, add drivers, vehicles and trips; police/SCS/SP officers approve, verify and check out trips; admins manage police accounts (including freezing and unfreezing them). The repo has two independent npm projects and no root package.json:

- `backend/`: Express 4 + Sequelize 6 (MySQL), CommonJS.
- `convoy/`: React 18 + Vite + TypeScript/JSX, with shadcn/ui (Radix + Tailwind). It started as a Lovable project.

The root `.sql` files are MySQL dumps/schema scripts (e.g. `dbscript.sql`). Tables are not created by migrations.

## Commands

Backend (run in `backend/`):
- `npm run dev`: nodemon `src/server.js`
- `npm start`: plain node; production uses pm2 or `start-node-server.bat`
- `npm run lint` / `npm run lint:fix` (there's no ESLint config in `backend/` yet, so these currently fail)
- `npm test`: Jest + supertest. No test files exist yet. To run one file: `npx jest path/to/file.test.js`.
- `npm run db:sync`: sets `DB_FORCE_SYNC=true`, which **drops and recreates tables** when `NODE_ENV=development`. `DB_ALTER_SYNC=true` runs an alter-sync instead. The script uses POSIX env syntax, so on Windows set the variable in `.env`.

Frontend (run in `convoy/`):
- `npm run dev`: Vite dev server on `VITE_DEV_HOST:VITE_DEV_PORT` (default port 8080). It proxies `/api` to `VITE_API_BASE_URL`.
- `npm run build` / `npm run build:dev` / `npm run preview`
- `npm run lint`

## Environment

- The backend refuses to start without `SESSION_SECRET` (checked in `config/environment.js`) and `ALLOWED_ORIGINS`, a comma-separated CORS allowlist (checked in `app.js`).
- The API binds to `HOST` (default `127.0.0.1`) and `PORT`. Set `TRUST_PROXY=1` when it runs behind Apache. Without it, every client shares the proxy's IP, so the login rate limit locks everyone out together.
- In deployment, Apache serves `dist/` at `/convoy` and reverse-proxies the API at `/convoy/api` (`deploy/apache/convoy.conf`). Production builds set `VITE_API_BASE_URL` to the public origin + `/convoy`, never to the internal IP. `convoy/public/.htaccess` carries the CSP and security headers and ships in every build.
- Schema changes go in `backend/migrations/*.sql` and are applied by hand (e.g. the `tokenVersion` columns).
- The frontend needs `VITE_API_BASE_URL`; `vite.config.ts` throws if it is missing. Both the Vite `base` and the router `basename` are `/convoy`, so the app is served at `/convoy/...`.
- Sequelize runs with timezone `+05:30` and `dateStrings: true`, so dates come back as strings, not `Date` objects.

## Backend architecture

There are effectively one route file, one controller and one service. Most of the API lives in three large files:
- `routes/auth.js` (~80 routes, all mounted under `/api/auth`, grouped by who may call them)
- `controllers/authController.js` (static methods)
- `services/authService.js` (~9k lines, static methods holding the business logic and Sequelize queries)

`routes/users.js` (`/api/users`) holds a few admin CRUD routes. Several files are empty placeholders: `baseController`, `userController`, `registrationController`, `baseService`, `userService`, `routes/index.js` and `middleware/validation.js`. Add new features to the auth route/controller/service trio unless told otherwise.

Request flow: route → rate limiter (`middleware/rateLimiter.js`) → auth middleware → `AuthController.x` → `AuthService.x` → models.

- **Accounts and tokens**: there are three account tables: `users` (citizens), `policeuser` (roles police/sp/scs/dsp) and `admin`. They share one JWT secret and their numeric IDs overlap. Every token therefore carries `typ` (`user`|`police`|`admin`) and `tv` (that account's `tokenVersion`). Tokens are issued only through `issueTokens()` in `utils/authSession.js`. Logout and police password changes increment `tokenVersion`, which revokes all outstanding tokens. Each login (`newSession`) also increments it when `SINGLE_SESSION` is on, so only the latest login stays valid. Logins require a browser-generated `loginNonce`, which is echoed in the access token as `ln`. The refresh token carries the session start time `st`, and `/refresh-token` refuses to renew after `SESSION_MAX_HOURS`. Its lifetime (`JWT_REFRESH_EXPIRES_IN`, 20m by default) is the server-side idle timeout. `COOKIE_SECURE` marks every cookie Secure without relying on the proxy's `X-Forwarded-Proto`.
- **Auth middleware** (`middleware/auth.js`): guards are built with `authenticate(...types)`, which checks the type, loads the account, and checks that it is active and that `tv` matches. Available guards: `authenticateToken` (citizens, plus police accounts with DB role `scs`, which use the citizen vehicle/driver/trip pages), `authenticatePoliceToken`, `authenticateAdmin`, `authenticatePoliceOrAdmin` and `authenticateAny`. They set `req.user` and `req.accountType`. **Every new route needs a guard.** Take the acting user's ID from `req.user.id`, never from the request body. For citizen trip access, use `AuthController.canAccessTrips` (ownership via `registration.reg_id`).
- **Login hardening**: `/captcha` (svg-captcha; the answer is kept in an `express-session`) and `/csrf-token` (the token is kept in the session) must both be called before login. `consumeCaptcha()` makes each captcha single-use with a 2-minute TTL, including after a failed attempt. Login, refresh, register and OTP routes use `csrfProtection`, which compares the `X-CSRF-Token` header to the session token. The frontend fetches the token with `convoy/src/api/csrf.ts`, using `withCredentials`. The refresh token exists only as an httpOnly `SameSite=Strict` cookie scoped to `/api/auth` and never appears in a JSON body.
- **Validation/sanitization**: `middleware/rejectUnsafeInput.js` rejects HTML tags, event handlers, `javascript:` and control characters in any body or query string on all `/api` routes (it skips password fields). On top of that, each input has a DTO class in `dto/request/` with `validate()` returning `{ isValid, errors }`, called inside the service, with a matching client-side validator in `convoy/src/utils/` (`inputSanitizer.js` has `containsUnsafeMarkup` and `escapeHtml`). Follow this pattern for new endpoints, and never put user data into SweetAlert `html:` or `dangerouslySetInnerHTML` without `escapeHtml`.
- **Responses**: always use `BaseResponseDTO.success(data, message)` / `BaseResponseDTO.error(message, errors)`, which produce `{ success, message, timestamp, data?, errors? }`. `middleware/errorHandler.js` is the final error handler.
- **Models**: `models/index.js` auto-loads every `.js` file in `models/` (each exports `(sequelize, DataTypes) => Model`) and calls `associate(db)`. Access models as `db.ModelName`. Subdirectories such as `Approval_relation` are not loaded.

## Frontend architecture

- `src/App.tsx` declares every route. Every page except landing, the logins, register and OTP is wrapped with `guard(roles, <Page />)` / `<ProtectedRoute>`, using the role groups `CITIZEN` and `POLICE` or `"admin"`. This is UX only; the API enforces the real access.
- `contexts/AuthContext.tsx` handles login for the three account types. It keeps `user` and `accessToken` **in memory only**, with no localStorage or sessionStorage. On load it restores the session by calling `/refresh-token` (httpOnly cookie), and it renews the token about 60 seconds before expiry. It never trusts a login or refresh response on its own: it checks the token's `ln` nonce and `typ`, then calls `GET /session`, and takes the user from that reply. Any non-auth API call that returns 401 (axios interceptor plus a `window.fetch` wrapper) ends the session immediately. Pages must get the token from `useAuth()`. Don't store auth or personal data in browser storage; pass data between pages through router state.
- API calls are centralized as plain functions in `contexts/PostApi.jsx` and `contexts/GetApi.jsx`. They use `fetch`/axios with `${VITE_API_BASE_URL}/api/auth/...` and take an `accessToken` argument. Despite the folder name, they are not React contexts. User feedback is shown with SweetAlert2 and toast.
- Idle/auto logout is handled in `hooks/useIdleLogout.js` and `hooks/useAutoLogout.js`. Server-side paginated tables use `hooks/useServerPagination.js`.
- `components/ui/` holds generated shadcn components; add new ones through shadcn rather than hand-editing. The `@/` import alias maps to `src/`.
