# Durable Waitlist Subscription Repair

**Date:** 2026-07-15  
**Status:** Approved for implementation

## Summary

Repair the landing-site waitlist so every submission reaches a terminal client state and a reported success always represents a durable Redis record. Redis connection, retry, socket, and command waits will be bounded; signup writes will be atomic and idempotent; and the form will recover from both server-declared failures and rejected or excessively slow server-action calls.

## Confirmed failure

The failure was reproduced against the production site on 2026-07-15:

1. A syntactically valid email was submitted on `budgie.at`.
2. The form entered its loading state and the server action reached the Redis connection path.
3. The server action did not settle, so the button spinner continued indefinitely and the form never showed success or an error.

A disposable probe reproduced the same pending connection behavior independently of the UI. The probe is diagnostic evidence only and will not be committed as a test or production utility.

## Root cause

Commit `8bad4f5aa` replaced `@vercel/kv` with `redis` and introduced the current failure mode:

- `createClient({ url: redisUrl })` uses the client defaults, including reconnection behavior that is not bounded for this server-action request path.
- `await client.connect()` can therefore remain pending across repeated connection attempts instead of returning a failure to `joinWaitlist`.
- The pending initialization promise is cached globally, causing later requests in the same process to wait on the same unresolved connection.
- The Redis `error` event is handled by `emptyFn`, hiding operational evidence while not resolving the pending action.
- When initialization does return `null`, an in-memory map reports success even though the signup is not durable and can disappear on process recycle.
- The client clears `isLoading` only after a fulfilled `joinWaitlist` call. A rejection or a call that never settles leaves the form spinning.

The migration also retained a read-before-write sequence whose `zScore`, `zCard`, `zAdd`, `hSet`, and `incr` operations are not atomic. Concurrent requests can allocate the same position or increment the total more than once for one normalized email.

## Goals

- A waitlist action returns success only after Redis durably accepts the signup.
- Redis unavailability produces a bounded, retryable error instead of an infinite wait or ephemeral success.
- Concurrent or repeated submissions for one normalized email are idempotent.
- Concurrent new signups receive distinct positions and update all waitlist structures together.
- The form always leaves loading state and gives the user a clear path to retry.
- Existing `messageKey` semantics are handled explicitly rather than reducing every response to a boolean.
- Verification covers the original hanging mode, the durable write path, and the production deployment configuration without exposing secrets.

## Non-goals

- Recalculating, backfilling, reconciling, or otherwise cleaning up the existing displayed waitlist count.
- Adding an email marketing, newsletter, CRM, or mailing-provider integration.
- Changing waitlist marketing copy, layout, count presentation, or unrelated landing-page behavior.
- Migrating away from Redis or changing the existing Redis key names.
- Adding unit-test infrastructure to `packages/landing`.

## Server design

### Bounded Redis lifecycle

Redis configuration will make every wait finite:

- Connection timeout: 2 seconds per attempt.
- Socket inactivity timeout: 3 seconds.
- Default command timeout: 2 seconds.
- Offline command queue: disabled so commands fail while the connection is unavailable instead of waiting for a later reconnect.
- Reconnect strategy: one retry after 250 milliseconds, then return an error.

These values keep the complete server attempt below the client's 8-second confirmation deadline under normal failure conditions. The implementation will use the installed `redis` client's supported `socket.connectTimeout`, `socket.socketTimeout`, `socket.reconnectStrategy`, `disableOfflineQueue`, and `commandOptions.timeout` options.

The connection cache must never preserve a failed or unresolved initialization forever. It may reuse a ready client, but a failed, closed, or timed-out client is destroyed and removed from the cache so a later user retry can create a fresh bounded connection. Missing `REDIS_URL`, connection exhaustion, command timeout, and script failure all produce `{ success: false, messageKey: 'error' }`; none may fall back to process memory.

Redis errors will be recorded through the landing package's server-side logging pattern with operation and failure category only. Logs must not contain the Redis URL, credentials, submitted email, or other secret values.

### Atomic and idempotent signup

One Redis-side script will own the signup decision and write. Its inputs are the existing key names, the normalized email, timestamp, and source. Redis executes the following logic atomically:

1. Read the email's score from `waitlist:emails`.
2. If a score exists, return an `already_registered` outcome and the existing position without changing any key.
3. Otherwise calculate the position from the sorted-set cardinality plus one.
4. Add the normalized email and position to `waitlist:emails`.
5. Write the corresponding `waitlist:user:<normalized-email>` hash with email, position, joined timestamp, and `landing` source.
6. Increment `waitlist:total` exactly once.
7. Return a `success` outcome and the assigned position.

This operation makes a retry safe even when the browser timed out before receiving the first response: the retry either creates the record once or observes the position already created. It also prevents two concurrent new emails from being assigned through interleaved read/write sequences.

The script preserves the current keys and count semantics. It does not repair historical differences between `waitlist:total`, the sorted set, or user hashes; that cleanup remains out of scope.

### Server result contract

The action keeps the existing message keys and gives each one a single meaning:

| `messageKey` | `success` | Position | Meaning |
| --- | --- | --- | --- |
| `invalid_email` | `false` | absent | Server-side validation rejected the normalized email. |
| `success` | `true` | present | The atomic script created a durable signup. |
| `already_registered` | `true` | present | The normalized email already had a durable signup. |
| `error` | `false` | absent | Redis configuration, connection, timeout, command, or unexpected processing failed. |

The server must not emit a success result without a valid position. Unknown Redis script results are treated as `error`, not coerced to success.

`getWaitlistCount` retains its current public behavior of returning zero on an unavailable count read so page rendering remains resilient. Its Redis access uses the same bounded client configuration, and it never reads from an in-memory fallback.

## Client design

Submission remains a client-side call to the server action, with an explicit 8-second confirmation deadline around the call. The deadline is a client-visible recovery boundary; the server's shorter limits remain the primary resource boundary.

The submit handler will:

1. Clear the previous error and enter loading state.
2. Await the server action within the 8-second deadline.
3. Handle `success` and `already_registered` as confirmed outcomes and render the existing success state with the returned position.
4. Map `invalid_email` to a localized validation error.
5. Map `error`, an unknown result, a rejected action, or the client deadline to a localized retryable error that does not claim the email was saved.
6. Clear the deadline and leave loading state in `finally`, regardless of outcome.

After a failure, the email input and submit button are enabled again; resubmitting is the retry mechanism. The timeout error should explain that the signup could not be confirmed and invite retry. Because server writes are idempotent, a retry is safe even if a delayed first action reached Redis.

New or changed user-facing error strings follow the landing package's Lingui rules and require `yarn i18n:sync` plus complete translations in the source and compiled catalogs. Existing success UI can remain shared for `success` and `already_registered`; the client still branches on both keys explicitly.

## Deployment configuration audit

Before deployment, audit the hosting environment metadata for production and preview targets:

- Confirm `REDIS_URL` is present in the intended deployment scopes.
- Confirm the variable is attached to the current Redis store and uses the expected TLS/non-TLS scheme for that provider.
- Confirm the deployment has outbound network access to the configured Redis endpoint.
- Confirm no obsolete provider variable is accidentally being relied on after the `@vercel/kv` migration.

The audit may report only presence, scope, provider attachment, and connectivity result. Commands, screenshots, logs, and review notes must not print or persist the URL, hostname, username, password, token, or a submitted email. No environment values are added to the repository.

## Verification

The project prohibits unit-test frameworks inside production packages, including `packages/landing`, so this repair will not add Jest or Vitest tests there. Verification uses disposable probes, repository validation, a production build, and manual behavior checks.

### Disposable reproduction probe

Use an untracked, disposable probe outside production source to exercise the same `redis` connection settings against an intentionally unreachable endpoint:

- Record that the current/default configuration remains pending beyond the expected UI wait, reproducing the root failure.
- Record that the repaired configuration rejects within the configured bounded interval.
- Confirm a failed attempt reports error and never reports success through memory.
- Delete the probe after use and verify it is absent from the commit.

The probe must use synthetic addresses and emails. If a real deployment variable is injected for a positive connectivity check, the probe must not echo it.

### Durable Redis behavior

Against a disposable Redis namespace or isolated development Redis instance, verify:

- One new normalized email returns `success` with a position and creates the sorted-set member, user hash, and one total increment.
- Repeating the same email with different casing or surrounding whitespace returns `already_registered` with the same position and does not increment the total.
- Concurrent submissions of the same email create one record and one total increment.
- Concurrent submissions of different emails receive distinct positions and complete all three writes.
- An unavailable Redis endpoint returns `error` within the bound and leaves no in-memory success path.

### Repository and build checks

Run the repository-required checks in order:

```bash
yarn format
yarn ts
yarn lint
yarn deadcode
yarn cpd
```

Then run a production landing build through the repository build command and start the built landing site with production-style environment injection. Submit a fresh synthetic email and a repeat of that email, verify both terminal UI states, and verify the Redis records directly without printing credentials or the email in shared logs.

Finally, repeat the production-style probe with Redis deliberately unavailable and confirm that the spinner stops within 8 seconds, the retryable error appears, and retry becomes available. After deployment, perform one smoke submission on `budgie.at` and confirm the action settles and the durable record exists.

## Acceptance criteria

- No valid submission can leave the form spinner running indefinitely.
- A Redis outage or missing configuration returns a retryable error within the documented bounds.
- The process contains no in-memory waitlist success fallback.
- A successful response corresponds to the complete durable Redis record.
- Same-email retries are idempotent, including concurrent submissions.
- Different concurrent signups receive distinct positions.
- Every defined `messageKey` has explicit client behavior, and unknown outcomes fail safely.
- Repository validation and the production build pass.
- Production and preview environment presence/connectivity are audited without exposing values.
- No count cleanup, mailing-provider integration, or landing unit-test framework is included.
