# iOS Bank Sync Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent suspended or overlapping polling sync runs from losing later accounts or blocking subsequent iOS foreground/background execution.

**Architecture:** Give the shared workload drain and each polling service generation-based ownership. App-state suspension invalidates current ownership; stale async continuations may settle their original promises but cannot drain more work, update sync progress, or release a newer owner. Concurrent polling requests schedule one follow-up pass instead of returning and disappearing.

**Tech Stack:** React Native AppState, Expo BackgroundTask/TaskManager, TypeScript, Vitest, MSW, Drizzle SQLite test harness.

---

## File Structure

- `tests/sync-tests/src/scenarios/monobank/suspended-run-lock.test.ts`: regression coverage for the two reproduced failures.
- `tests/sync-tests/src/harness/scenario/reset-singletons.ts`: reset generation state between integration scenarios.
- `packages/app/src/sync/service/sync-workload.service.ts`: generation-owned queue draining and interruption entrypoint.
- `packages/app/src/sync/service/abstract-polling-sync.service.ts`: generation-owned polling runs and preserved follow-up requests.
- `packages/app/src/app/root-layout-content.tsx`: invalidate foreground ownership when the app leaves the active state and trigger the existing refresh when it returns.

### Task 1: Lock the reproduced failures with deterministic tests

**Files:**
- Modify: `tests/sync-tests/src/scenarios/monobank/suspended-run-lock.test.ts`

- [ ] **Step 1: Keep the lost-follow-up test red with a completed first account**

Use a forward timestamp older than the stale threshold but inside one Monobank request window:

```ts
const staleForwardSyncFromAt = new Date(Date.now() - 10 * 60 * 1000);
```

Keep a background queue item pending while the direct polling run completes account one. Trigger a second `sync()` during account one's request and assert that account two is eventually requested after the blocker is released.

- [ ] **Step 2: Model the iOS interruption boundary explicitly**

After the first foreground request starts, invoke the two intended interruption entrypoints before queuing the replacement background task:

```ts
syncWorkloadService.interruptActiveWork();
monobankSyncService.interruptActiveRun();
```

Capture whether replacement work starts before releasing the original request, then release both paths so the test always tears down cleanly.

- [ ] **Step 3: Run the regression file and confirm RED**

Run:

```bash
pnpm --filter @budgie-at/sync-tests test -- src/scenarios/monobank/suspended-run-lock.test.ts
```

Expected: FAIL because both interruption methods are absent and the active run currently discards the follow-up request.

### Task 2: Make the shared workload drain interruption-safe

**Files:**
- Modify: `packages/app/src/sync/service/sync-workload.service.ts`
- Modify: `tests/sync-tests/src/harness/scenario/reset-singletons.ts`
- Test: `tests/sync-tests/src/scenarios/monobank/suspended-run-lock.test.ts`
- Test: `tests/sync-tests/src/scenarios/sync/user-work-priority.test.ts`

- [ ] **Step 1: Add drain generation state and public interruption**

Add state owned by `SyncWorkloadService`:

```ts
private drainGeneration = 0;
```

Add the lifecycle entrypoint:

```ts
@Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
interruptActiveWork(): void {
    this.drainGeneration += 1;
    this.isRunning = false;
    this.startDrain();
}
```

- [ ] **Step 2: Bind every drain to its generation**

Start and recurse only while the drain owns the current generation:

```ts
private startDrain(): void {
    if (this.isRunning || !this.hasQueuedWork()) {
        return;
    }

    this.isRunning = true;
    this.drainGeneration += 1;
    const drainGeneration = this.drainGeneration;
    this.drain(drainGeneration).catch((error: unknown) => void emptyFn(error));
}

private async drain(drainGeneration: number): Promise<void> {
    try {
        await this.drainQueuedTasks(drainGeneration);
    } finally {
        if (drainGeneration !== this.drainGeneration) {
            return;
        }

        this.isRunning = false;
        this.startDrain();
    }
}

private async drainQueuedTasks(drainGeneration: number): Promise<void> {
    if (drainGeneration !== this.drainGeneration) {
        return;
    }

    const task = this.takeNextTask();
    if (!isDefined(task)) {
        return;
    }

    await task.run();
    await this.drainQueuedTasks(drainGeneration);
}
```

- [ ] **Step 3: Reset the new singleton field in the harness**

Add `drainGeneration: 0` to the existing `Object.assign(syncWorkloadService, ...)` reset object.

- [ ] **Step 4: Run queue tests**

Run:

```bash
pnpm --filter @budgie-at/sync-tests test -- src/scenarios/sync/user-work-priority.test.ts src/scenarios/monobank/suspended-run-lock.test.ts
```

Expected: queue-priority tests PASS; polling ownership assertions remain RED until Task 3.

### Task 3: Make polling runs interruption-safe and preserve follow-up work

**Files:**
- Modify: `packages/app/src/sync/service/abstract-polling-sync.service.ts`
- Modify: `packages/app/src/app/root-layout-content.tsx`
- Modify: `tests/sync-tests/src/harness/scenario/reset-singletons.ts`
- Test: `tests/sync-tests/src/scenarios/monobank/suspended-run-lock.test.ts`
- Test: `tests/sync-tests/src/scenarios/monobank/forward-sync-run-boundary.test.ts`
- Test: `tests/sync-tests/src/scenarios/monobank/queued-work-yield.test.ts`

- [ ] **Step 1: Track polling generation and a requested follow-up pass**

Add class state:

```ts
private runGeneration = 0;
private runRequested = false;
```

When `sync()` is called during an active run, preserve the request:

```ts
if (this.isRunning) {
    this.runRequested = true;

    return BackgroundTask.BackgroundTaskResult.Success;
}
const runGeneration = this.startSyncRun(deadlineAtMs);
```

- [ ] **Step 2: Add polling interruption and ownership checks**

Expose:

```ts
@Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
interruptActiveRun(): void {
    this.runGeneration += 1;
    this.isRunning = false;
    this.runRequested = false;
    this.failedSyncId = null;
    this.processedForwardSyncIds.clear();
}
```

Change `startSyncRun` to increment and return the generation. Thread that value through `executeSyncLoop`, `processPendingSyncs`, `processSyncBatch`, error recovery, and `finishSyncRun`. At every boundary after an `await`, return `BackgroundTaskResult.Success` when `runGeneration !== this.runGeneration`. Only the current owner may apply progress, recurse, clear state, or call `afterSyncRun`.

- [ ] **Step 3: Schedule exactly one preserved follow-up pass**

In the current owner's finish path, snapshot `runRequested`, clear current state, await `afterSyncRun`, and enqueue a new workload after ownership is released:

```ts
const shouldScheduleFollowUp = this.runRequested;
this.runRequested = false;
this.isRunning = false;
await this.afterSyncRun();

if (shouldScheduleFollowUp) {
    syncWorkloadService.run(`${this.provider}-follow-up`, () => this.sync()).catch(emptyFn);
}
```

Import `emptyFn` from `@rnw-community/shared`. Do not create a deferred resolver or retain a promise bridge.

- [ ] **Step 4: Connect the app-state interruption boundary**

Update the existing handler in `root-layout-content.tsx`:

```ts
const handleAppStateChange = (isActive: boolean): void => {
    if (!isActive) {
        monobankSyncService.interruptActiveRun();
        syncWorkloadService.interruptActiveWork();

        return;
    }

    void syncWorkloadService.run('foreground', syncForegroundData).catch(emptyFn);
};
```

Only Monobank is invalidated at the app-state boundary. Its fetched batch is generation-checked before transaction writes. Binance keeps its current multi-phase owner and records a follow-up request instead of overlapping a replacement run with phase-level writes.

- [ ] **Step 5: Reset polling generation state in integration tests**

Add `runGeneration: 0` and `runRequested: false` to the Monobank and Binance reset objects.

- [ ] **Step 6: Run the focused sync regression suite**

Run:

```bash
pnpm --filter @budgie-at/sync-tests test -- src/scenarios/monobank/suspended-run-lock.test.ts src/scenarios/monobank/forward-sync-run-boundary.test.ts src/scenarios/monobank/queued-work-yield.test.ts src/scenarios/sync/user-work-priority.test.ts
```

Expected: 4 files PASS with zero failed tests.

### Task 4: Verify repository quality gates

**Files:**
- Modify only files changed by automatic formatting when necessary.

- [ ] **Step 1: Format**

Run `pnpm format` and review the diff.

- [ ] **Step 2: Run TypeScript**

Run `pnpm ts` and require exit code 0.

- [ ] **Step 3: Run lint**

Run `pnpm lint` and require exit code 0.

- [ ] **Step 4: Run dead-code detection**

Run `pnpm deadcode` and require exit code 0.

- [ ] **Step 5: Run duplication detection**

Run `pnpm cpd` and require exit code 0.

- [ ] **Step 6: Review the final diff**

Run:

```bash
git diff --check
git status --short
git diff --stat origin/main...HEAD
```

Expected: no whitespace errors, only the approved design, implementation plan, regression tests, lifecycle wiring, and generation-ownership changes.
