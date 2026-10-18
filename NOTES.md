# Notes: `PUT /users/:id`

## Plan

The plan was written in plan mode after reading `tests/update-user.test.js`, and I approved it without edits. It covered:

- a `store.updateUser(id, { name, email })` helper that reuses `getUserById` and returns `undefined` for an unknown id;
- a `PUT /users/:id` route with full-replacement semantics, where both fields must be non-empty strings;
- validation before the lookup, so 400 takes precedence over 404, matching POST;
- non-numeric ids returning 404, consistent with GET;
- the id is never taken from the body.

The plan named the trade-offs up front: PUT validates more strictly than POST, there is no e-mail format check, and POST stays unchanged because it is out of scope.

## Model

I ran the session in `opusplan`, my default mode, which uses Opus in plan mode and Sonnet everywhere else. So `/init`, which runs outside plan mode, produced `CLAUDE.md` on Sonnet 4.5, and the planning ran on Opus 5.5.

Implementation and review also stayed on Opus 5.5, although I never switched models on purpose. My best guess is that I rejected the plan-mode exit dialog and approved the plan in chat instead, so the session never formally left plan mode. I have not verified this.

## Commits

One logical change per commit, and each commit passes lint:

1. `feat(store)`: data layer (`updateUser`).
2. `feat(users)`: HTTP layer (the route). The grading tests turn green here.
3. `docs`: `CLAUDE.md`, with claims from `/init` that turned out to be wrong removed. It claimed "pure functions", "tests check error shapes", and an invented merge rule.
4. `chore`: ignore `.idea/`.
5. `refactor(users)`: drop dead code found in review.
6. `test(users)`: validation tests found missing in review.
7. `docs`: this file.

Store and route are split so the data-layer change can be reviewed on its own. The downside is that commit 1 adds a helper nothing calls yet.

## Review

I ran `/code-review` on `main...HEAD` and verified each finding by executing it before acting on it.

- **Fixed:** `req.body ?? {}` was dead code. body-parser 1.20 always sets `req.body = {}` and rejects a top-level `null`. My plan's reason for the guard was wrong, and commit 5 corrects it.
- **Fixed:** the stricter validation had no tests. They are in `tests/update-user-validation.test.js`. A mutation check, weakening the validator to a truthy check, makes 4 of them fail.
- **Fixed blind spot:** the grading test "404 for unknown user" was already green before any code existed, because Express's default 404 for an unmatched route satisfies it. The new tests also assert the route's `{ error: "User not found" }` body.
- **Confirmed, not fixed (pre-existing, out of scope):** malformed JSON returns Express's HTML 400 with a stack trace, on POST too. Ids like `0x1`, `1.0` and `1e0` resolve to user 1, inherited from GET's `Number()` parsing.
- **Confirmed, not fixed (deliberate):** surrounding whitespace is stored as sent, there is no e-mail format or uniqueness check, and PUT and POST validation differ.
