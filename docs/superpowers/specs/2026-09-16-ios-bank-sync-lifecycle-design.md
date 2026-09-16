# iOS Bank Sync Lifecycle Design

## Goal

Ensure polling bank sync advances through every pending account, survives iOS suspension without leaving an in-memory lock behind, runs when iOS grants background execution time, and resumes immediately when the app becomes active.

## Platform Constraint

`expo-background-task` uses iOS `BGTaskScheduler`. iOS decides when a registered task runs, so the app cannot promise uninterrupted or immediate execution after entering the background. The app can guarantee that suspension does not permanently block later work and that pending work resumes at the next granted background or foreground opportunity.

## Root Cause

Polling services and the shared sync workload queue use process-local `isRunning` booleans. When iOS suspends JavaScript while an awaited operation is in flight, those booleans can remain set. Later foreground or background invocations then either return as if work were already active or remain queued behind the suspended workload. Restarting the process clears the stale state, which explains why an app restart restores syncing.

## Design

### Interruptible workload ownership

The shared workload service will assign each drain an ownership generation. When the app leaves the active state, it will invalidate the active generation and release the drain latch while retaining valid queued work. A resumed stale drain may settle its original caller, but it cannot change the ownership state of a newer drain or consume additional queued tasks.

### Interruptible polling runs

Each polling sync run will similarly capture a generation. App suspension invalidates the active run and clears its latch. Every loop and persistence boundary will confirm that the run still owns the current generation before selecting or advancing another account. A stale run can finish an already-started external request, but it cannot continue the sync loop or overwrite progress owned by a newer run.

### Lifecycle behavior

When the app becomes inactive, the root lifecycle handler will interrupt foreground sync ownership. Registered Expo background tasks remain available to start replacement runs when iOS grants execution time. When the app becomes active, the existing foreground refresh path will immediately queue another sync attempt.

### Multi-account progression

Polling sync will keep querying pending records after each completed account. Concurrent requests made while a run is active will record that another pass is required instead of being silently discarded. The active owner will perform that pass before releasing ownership, unless it has been interrupted or reached a background deadline.

## Error Handling

Interruption is not a sync failure and must not increment error counters or disable an account. Existing provider errors retain their current retry and disable behavior. A stale generation exits successfully after reaching a safe boundary so background task scheduling is not penalized for an expected lifecycle transition.

## Verification

Integration coverage will prove:

- a run processes a second pending account after the first completes;
- an invocation received during an active run causes a follow-up pass rather than disappearing;
- invalidating a suspended workload allows a replacement task to execute;
- a stale workload or polling generation cannot release or continue a newer owner;
- existing queue priority and Monobank forward-run boundary behavior remain intact.

Repository validation will run formatting, TypeScript, lint, dead-code detection, and duplication detection after the focused sync integration suite.

## Out of Scope

- Guaranteeing immediate execution while an iOS app is suspended.
- Adding a custom native background-time module.
- Replacing Expo background tasks or the Monobank client.
