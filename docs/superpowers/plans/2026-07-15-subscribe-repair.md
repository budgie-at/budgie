# Durable Waitlist Subscription Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make landing-page waitlist submissions terminate predictably and report success only after an atomic, durable Redis write.

**Architecture:** Keep the existing server-action boundary, but replace the unbounded cached Redis connection and in-memory fallback with a bounded, recoverable client and one idempotent Lua operation. Wrap the client call in an 8-second deadline, branch explicitly on every validated `WaitlistMessageKeyEnum` member, announce errors through `role="alert"`, and always clear loading state in `finally`.

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

- [x] **Step 1: Run the disposable RED probe against an unreachable synthetic endpoint**

Create `/tmp/budgie-waitlist-redis-probe.mjs` with a synthetic endpoint, invoke the current/default client connection, race it against a finite diagnostic boundary, and print only elapsed milliseconds plus `pending` or `rejected`; never print a URL, credential, or submitted email.

Run:

```bash
rtk node /tmp/budgie-waitlist-redis-probe.mjs
```

Observed: the default handshake remained `pending` after 5,516 milliseconds, reproducing the non-terminal server path. The probe stayed untracked and outside the repository.

- [x] **Step 2: Replace the Redis lifecycle with bounded configuration and cache recovery**

In `waitlist.action.ts`, configure `createClient` with these client-level limits:

```typescript
const client = createClient({
    url: redisUrl,
    socket: {
        connectTimeout: 2_000,
        reconnectStrategy: (retryCount) => (retryCount < 1 ? 250 : false)
    },
    disableOfflineQueue: true,
    commandOptions: { timeout: 2_000 }
});
```

Do not configure `socket.socketTimeout`; idle time on a reusable ready connection is not an operation deadline. Wrap the whole `connect()` operation in an explicit 4,500-millisecond deadline and wrap every `eval` and `get` in an explicit 2,000-millisecond deadline. The configured 2,000-millisecond `commandOptions.timeout` remains a second layer of command defense.

Reuse only a ready client. If connection initialization rejects, times out, closes, or yields a non-ready client, destroy the exact client involved and clear the cached client/promise only if it still matches that client before returning the action-level error result. This lets a user retry start a fresh bounded connection without an older failure clearing a newer cached client. Remove the process-memory map completely. Use the landing server logger to record operation and failure category only; do not log Redis configuration values or email data.

- [x] **Step 3: Validate the action boundary and Lua result with Zod**

Normalize the submitted email with `trim().toLowerCase()`, validate it with a Zod email schema and a 254-character maximum, and return `{ success: false, messageKey: WaitlistMessageKeyEnum.INVALID_EMAIL }` on failure. Define a Zod schema for only `WaitlistMessageKeyEnum.SUCCESS`, `WaitlistMessageKeyEnum.ALREADY_REGISTERED`, and their positive integer positions; parse the unknown `eval` response before constructing the public result. Treat parse failure or an unknown outcome as `{ success: false, messageKey: WaitlistMessageKeyEnum.ERROR }`.

- [x] **Step 4: Replace read-before-write commands with one atomic Lua signup**

Execute one Lua script with the existing sorted-set, total, and `waitlist:user:<normalized-email>` keys plus normalized email, timestamp, and `landing` source. The script verifies the email key type before `ZSCORE`, returns an existing email before validating increment-only state, and performs every remaining key/value preflight before the first new-signup mutation:

```lua
local emailsType = redis.call('TYPE', KEYS[1]).ok
if emailsType ~= 'none' and emailsType ~= 'zset' then
    return redis.error_reply('WAITLIST_EMAILS_TYPE')
end
local existingPosition = redis.call('ZSCORE', KEYS[1], ARGV[1])
if existingPosition then
    return { 'already_registered', tonumber(existingPosition) }
end

local userType = redis.call('TYPE', KEYS[3]).ok
if userType ~= 'none' and userType ~= 'hash' then
    return redis.error_reply('WAITLIST_USER_TYPE')
end
local totalType = redis.call('TYPE', KEYS[2]).ok
if totalType ~= 'none' and totalType ~= 'string' then
    return redis.error_reply('WAITLIST_TOTAL_TYPE')
end
if totalType == 'string' then
    local total = redis.call('GET', KEYS[2])
    local maximumIncrementableTotal = '9223372036854775806'
    if total ~= '0' and not string.match(total, '^[1-9][0-9]*$') then
        return redis.error_reply('WAITLIST_TOTAL_VALUE')
    end
    if string.len(total) > string.len(maximumIncrementableTotal) or
        (string.len(total) == string.len(maximumIncrementableTotal) and total > maximumIncrementableTotal) then
        return redis.error_reply('WAITLIST_TOTAL_OVERFLOW')
    end
end

local position = redis.call('ZCARD', KEYS[1]) + 1
redis.call('ZADD', KEYS[1], position, ARGV[1])
redis.call('HSET', KEYS[3], 'email', ARGV[1], 'position', position, 'joinedAt', ARGV[2], 'source', ARGV[3])
redis.call('INCR', KEYS[2])
return { 'success', position }
```

This accepts only the canonical nonnegative signed 64-bit integer representation for an existing total and reserves room for `INCR`. Map the two success enum members to `{ success: true, messageKey, position }`. A server result must never claim success without a validated position. Keep `getWaitlistCount` resilient by returning zero on bounded Redis failure, without any in-memory fallback.

- [x] **Step 5: Run the GREEN probe with the repaired options**

Update the disposable probe to use the exact connect, reconnect, offline-queue, command timeout, whole-connect deadline, and command deadline settings above.

Run:

```bash
rtk node /tmp/budgie-waitlist-redis-probe.mjs
```

Observed: the handshake rejected after 4,506 milliseconds at the 4.5-second whole-connect deadline, and the stalled command rejected after 2,003 milliseconds at the 2-second command deadline. Neither path reported success. `/tmp/budgie-waitlist-redis-probe.mjs` was deleted.

- [x] **Step 6: Check the server change and commit it**

Run:

```bash
rtk yarn prettier packages/landing/src/generic/action/waitlist.action.ts --write
rtk yarn ts
rtk git status --short
```

Expected: formatting succeeds, TypeScript passes, and the disposable probe is absent from status.

Commit the server action with its shared enum and required landing dependency metadata:

```bash
rtk git add packages/landing/src/generic/action/waitlist.action.ts packages/landing/src/generic/enum/waitlist-message-key.enum.ts packages/landing/package.json yarn.lock
rtk git commit -m "fix(landing): make waitlist signup durable"
```

### Task 2: Guarantee a terminal client state and localize every outcome

**Files:**
- Modify: `packages/landing/src/generic/component/waitlist-form/waitlist-form.tsx`
- Modify: `packages/landing/src/i18n/locales/{en,de,es,fr,uk}/messages.po`
- Regenerate: `packages/landing/src/i18n/locales/{en,de,es,fr,uk}/messages.ts`

- [x] **Step 1: Add an 8-second client confirmation deadline**

In `waitlist-form.tsx`, race `joinWaitlist` against a rejecting 8-second timer. Use an inline `new Promise` compatible with Safari rather than `Promise.withResolvers`, store the timer handle locally, clear it after settlement, and keep all loading cleanup in `finally`. Do not add a hook or reusable utility for this single consumer.

- [x] **Step 2: Handle every `messageKey` explicitly**

Clear the previous error before submission, set loading before the race, and branch on `result.messageKey` through the success condition and an enum-keyed localized error-message record:

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

After failure, preserve the entered email and re-enable the input/button so retry is immediate and idempotent. Render the error element with `role="alert"` so the localized terminal error is announced to assistive technology.

- [x] **Step 3: Sync and complete Lingui translations**

Run:

```bash
rtk yarn i18n:sync
```

Expected: the new English message IDs appear in every locale catalog. Fill every empty `msgstr` in `de`, `es`, `fr`, and `uk`, then rerun `rtk yarn i18n:sync` so both `.po` and generated `.ts` files are current.

- [x] **Step 4: Check the client/catalog change and commit it**

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

- [x] **Step 2: Run the required repository validation in order**

Run:

```bash
rtk yarn format
rtk yarn ts
rtk yarn lint
rtk yarn deadcode
rtk yarn cpd
```

Expected: every command exits zero. If `yarn format` changes intended files, review and amend the owning implementation commit before continuing.

- [x] **Step 3: Build the production workspace**

Run:

```bash
rtk yarn build
```

Observed: the workspace production build exited zero.

- [ ] **Step 4: Manually verify the production-style landing site**

Start the built landing site with production-style environment injection, submit one fresh synthetic email and then its whitespace/case variant, and verify terminal `success` and `already_registered` UI states with matching durable Redis records. Repeat with Redis deliberately unavailable; the spinner must stop within 8 seconds, show the retryable error through the alert region, preserve the input, and enable retry.

- [ ] **Step 5: Audit deployment configuration by variable name only**

For both production and preview scopes, confirm that `REDIS_URL` is present, attached to the current Redis provider, uses the provider-expected TLS/non-TLS scheme, and is reachable from the deployment. Confirm no obsolete Vercel KV variable is relied upon. Record only variable names, scope, provider attachment, and pass/fail connectivity; never print or persist the URL, hostname, username, password, token, or email.

- [x] **Step 6: Review scope and commit state**

Run:

```bash
rtk git status --short
rtk git log -2 --oneline
```

Observed: the implementation scope contains the bounded durable server repair, shared enum, client recovery and accessibility behavior, dependency/catalog updates, and no probe, unit-test infrastructure, count cleanup, provider integration, environment value, or unrelated landing change.

- [ ] **Step 7: Perform the deployed smoke check**

After deployment, submit one fresh synthetic address on `budgie.at`. Confirm the action settles, the UI reaches a terminal state, and a durable record exists without exposing the address or Redis credentials in shared logs.
