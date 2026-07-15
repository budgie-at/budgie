# Durable Waitlist Subscription Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make landing-page waitlist submissions terminate predictably and report success only after an atomic, durable Redis write.

**Architecture:** Keep the existing server-action boundary, but replace the unbounded cached Redis connection and in-memory fallback with a bounded, recoverable client and one idempotent Lua operation. Wrap the client call in an 8-second deadline, branch explicitly on every validated `messageKey`, and always clear loading state in `finally`.

**Tech Stack:** Next.js server actions, TypeScript, `redis` 5.12.1, Zod, React, Lingui, Yarn workspaces

---

## File map

- Modify `packages/landing/src/generic/action/waitlist.action.ts`: bounded Redis lifecycle, Zod input/result validation, atomic signup script, safe error results, and bounded count reads.
- Modify `packages/landing/src/generic/component/waitlist-form/waitlist-form.tsx`: 8-second deadline, explicit result handling, localized retry errors, and unconditional loading cleanup.
- Leave `packages/landing/src/generic/component/waitlist-form/waitlist-success.tsx` unchanged: both confirmed success outcomes continue to use the existing success UI.
- Modify `packages/landing/src/i18n/locales/{en,de,es,fr,uk}/messages.po`: source translations for new or changed errors.
- Regenerate `packages/landing/src/i18n/locales/{en,de,es,fr,uk}/messages.ts`: compiled Lingui catalogs.
- Create and delete `/tmp/budgie-waitlist-redis-probe.mjs`: disposable RED/GREEN timeout probe; never commit it.

### Task 1: Make Redis access bounded, recoverable, atomic, and durable

**Files:**
- Modify: `packages/landing/src/generic/action/waitlist.action.ts`
- Create temporarily, then delete: `/tmp/budgie-waitlist-redis-probe.mjs`

- [ ] **Step 1: Run the disposable RED probe against an unreachable synthetic endpoint**

Create `/tmp/budgie-waitlist-redis-probe.mjs` with a synthetic URL such as `redis://127.0.0.1:6399`, invoke the current/default client connection, race it against an 8-second timer, and print only elapsed milliseconds plus `pending` or `rejected`; never print a URL, credential, or submitted email.

Run:

```bash
rtk node /tmp/budgie-waitlist-redis-probe.mjs
```

Expected: `pending` at the deadline, reproducing the non-terminal server path. Keep the probe untracked and outside the repository.

- [ ] **Step 2: Replace the Redis lifecycle with bounded configuration and cache recovery**

In `waitlist.action.ts`, configure `createClient` with these exact limits:

```typescript
const client = createClient({
    url: redisUrl,
    socket: {
        connectTimeout: 2_000,
        socketTimeout: 3_000,
        reconnectStrategy: (retryCount) => (retryCount < 1 ? 250 : false)
    },
    disableOfflineQueue: true,
    commandOptions: { timeout: 2_000 }
});
```

Reuse only a ready client. If connection initialization rejects, times out, closes, or yields a non-ready client, destroy it and clear the cached client/promise before returning the action-level error result so a user retry starts a fresh connection. Remove the process-memory map completely. Use the landing server logger to record operation and failure category only; do not log Redis configuration values or email data.

- [ ] **Step 3: Validate the action boundary and Lua result with Zod**

Normalize the submitted email with `trim().toLowerCase()`, validate it with a Zod email schema, and return `{ success: false, messageKey: 'invalid_email' }` on failure. Define a Zod schema for only the two Redis script outcomes and their positive integer positions; parse the unknown `eval` response before constructing the public result. Treat parse failure or an unknown outcome as `{ success: false, messageKey: 'error' }`.

- [ ] **Step 4: Replace read-before-write commands with one atomic Lua signup**

Execute one Lua script with the existing sorted-set, total, and `waitlist:user:<normalized-email>` keys plus normalized email, timestamp, and `landing` source. The script must:

```lua
local existingPosition = redis.call('ZSCORE', KEYS[1], ARGV[1])
if existingPosition then
    return { 'already_registered', tonumber(existingPosition) }
end

local position = redis.call('ZCARD', KEYS[1]) + 1
redis.call('ZADD', KEYS[1], position, ARGV[1])
redis.call('HSET', KEYS[3], 'email', ARGV[1], 'position', position, 'joinedAt', ARGV[2], 'source', ARGV[3])
redis.call('INCR', KEYS[2])
return { 'success', position }
```

Map `success` and `already_registered` to `{ success: true, messageKey, position }`. A server result must never claim success without a validated position. Keep `getWaitlistCount` resilient by returning zero on bounded Redis failure, without any in-memory fallback.

- [ ] **Step 5: Run the GREEN probe with the repaired options**

Update the disposable probe to use the exact socket, reconnect, offline-queue, and command timeout settings above.

Run:

```bash
rtk node /tmp/budgie-waitlist-redis-probe.mjs
```

Expected: `rejected` within the configured bounded interval and well before 8 seconds. Confirm no success is reported, then delete `/tmp/budgie-waitlist-redis-probe.mjs`.

- [ ] **Step 6: Check the server change and commit it**

Run:

```bash
rtk yarn prettier packages/landing/src/generic/action/waitlist.action.ts --write
rtk yarn ts
rtk git status --short
```

Expected: formatting succeeds, TypeScript passes, and the disposable probe is absent from status.

Commit only the server action:

```bash
rtk git add packages/landing/src/generic/action/waitlist.action.ts
rtk git commit -m "fix(landing): make waitlist signup durable"
```

### Task 2: Guarantee a terminal client state and localize every outcome

**Files:**
- Modify: `packages/landing/src/generic/component/waitlist-form/waitlist-form.tsx`
- Modify: `packages/landing/src/i18n/locales/{en,de,es,fr,uk}/messages.po`
- Regenerate: `packages/landing/src/i18n/locales/{en,de,es,fr,uk}/messages.ts`

- [ ] **Step 1: Add an 8-second client confirmation deadline**

In `waitlist-form.tsx`, race `joinWaitlist` against a rejecting 8-second timer. Store the timer handle locally, clear it after settlement, and keep all loading cleanup in `finally`. Do not add a hook or reusable utility for this single consumer.

- [ ] **Step 2: Handle every `messageKey` explicitly**

Clear the previous error before submission, set loading before the race, and use a `switch` over `result.messageKey`:

- `success` and `already_registered`: require the returned position and render the existing `WaitlistSuccess` state.
- `invalid_email`: show the localized validation error.
- `error`: show a localized retryable error that does not claim the signup was saved.
- Rejected action, deadline rejection, or unknown response: show a localized “could not confirm; retry” error.

Finish the handler with:

```typescript
finally {
    clearTimeout(deadlineTimeout);
    setIsLoading(false);
}
```

After failure, preserve the entered email and re-enable the input/button so retry is immediate and idempotent.

- [ ] **Step 3: Sync and complete Lingui translations**

Run:

```bash
rtk yarn i18n:sync
```

Expected: the new English message IDs appear in every locale catalog. Fill every empty `msgstr` in `de`, `es`, `fr`, and `uk`, then rerun `rtk yarn i18n:sync` so both `.po` and generated `.ts` files are current.

- [ ] **Step 4: Check the client/catalog change and commit it**

Run:

```bash
rtk yarn prettier packages/landing/src/generic/component/waitlist-form/waitlist-form.tsx packages/landing/src/i18n/locales --write
rtk yarn ts
rtk git status --short
```

Expected: formatting and TypeScript pass; status contains only the form and intended source/compiled catalogs.

Commit:

```bash
rtk git add packages/landing/src/generic/component/waitlist-form/waitlist-form.tsx packages/landing/src/i18n/locales
rtk git commit -m "fix(landing): recover stalled waitlist submissions"
```

### Task 3: Verify Redis behavior, repository health, build output, and deployment metadata

**Files:**
- No repository files should change except formatter/catalog output already committed above.

- [ ] **Step 1: Verify atomic behavior against an isolated Redis namespace**

Using synthetic emails and an isolated development Redis instance, verify directly without logging values:

- One new email returns `success`, creates the sorted-set member and user hash, and increments the total once.
- The same normalized email with whitespace/case changes returns `already_registered` with the same position and does not increment again.
- Concurrent same-email requests create one record and one increment.
- Concurrent different-email requests receive distinct positions and all three writes complete.
- An unavailable endpoint returns `error` within the server bound and never reports process-memory success.

Expected: all five checks pass. Delete any local verification data and scripts afterward; do not add a landing unit-test framework or commit a probe.

- [ ] **Step 2: Run the required repository validation in order**

Run:

```bash
rtk yarn format
rtk yarn ts
rtk yarn lint
rtk yarn deadcode
rtk yarn cpd
```

Expected: every command exits zero. If `yarn format` changes intended files, review and amend the owning implementation commit before continuing.

- [ ] **Step 3: Build and manually verify the production-style landing site**

Run:

```bash
rtk yarn build
```

Expected: the workspace production build exits zero. Start the built landing site with production-style environment injection, submit one fresh synthetic email and then its whitespace/case variant, and verify terminal `success` and `already_registered` UI states with matching durable Redis records. Repeat with Redis deliberately unavailable; the spinner must stop within 8 seconds, show the retryable error, preserve the input, and enable retry.

- [ ] **Step 4: Audit deployment configuration by variable name only**

For both production and preview scopes, confirm that `REDIS_URL` is present, attached to the current Redis provider, uses the provider-expected TLS/non-TLS scheme, and is reachable from the deployment. Confirm no obsolete Vercel KV variable is relied upon. Record only variable names, scope, provider attachment, and pass/fail connectivity; never print or persist the URL, hostname, username, password, token, or email.

- [ ] **Step 5: Review scope and commit state**

Run:

```bash
rtk git status --short
rtk git log -2 --oneline
```

Expected: the worktree is clean; only the two conventional implementation commits exist for the repair; no probe, unit-test infrastructure, count cleanup, provider integration, environment value, or unrelated landing change is committed.

- [ ] **Step 6: Perform the deployed smoke check**

After deployment, submit one fresh synthetic address on `budgie.at`. Confirm the action settles, the UI reaches a terminal state, and a durable record exists without exposing the address or Redis credentials in shared logs.
