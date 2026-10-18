# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm test                                  # All tests (node --test, discovers *.test.js)
node --test tests/update-user.test.js     # Single test file
node --test --test-name-pattern="404"     # Tests matching a name
npm run dev                               # Server with --watch on PORT (default 3000)
npm run lint                              # ESLint (eslint:recommended)
```

CI (`.github/workflows/ci.yml`, Node 22) runs `npm run lint` and `npm test` on every push and PR.

## Architecture

Minimal Express API (CommonJS) with an in-memory store.

- `server.js` builds the app, mounts routers, and only calls `listen()` when run directly. Tests import `app` and drive it with `supertest` — no port is opened.
- `routes/*.js` handle HTTP: parse params, validate input, map store results to status codes.
- `db/store.js` owns all data. Routes must never touch the `users` array directly — add a store function first, then call it. Store functions mutate module-level state and return `undefined` for unknown ids; the route turns that into a 404.
- Data resets on restart. `node --test` runs each test file in its own process, so state is shared between tests within a file but not across files.

## Conventions

- Ids come from `Number(req.params.id)`; non-numeric ids yield `NaN`, find nothing, and return 404.
- Errors are `{ error: "<message>" }`: 400 for invalid input, 404 with `"User not found"` for unknown ids. Tests assert status codes, not error messages.
- Validate the body before the store lookup (400 takes precedence over 404).
- `PUT /users/:id` is a full replacement: `name` and `email` must be non-empty strings. `POST /users` only checks that they're truthy.

## Tests

Files in `tests/` are grading tests for a course project. Do not edit them; fix the implementation instead. `tests/notes.test.js` requires a root `NOTES.md` with at least 80 characters.
