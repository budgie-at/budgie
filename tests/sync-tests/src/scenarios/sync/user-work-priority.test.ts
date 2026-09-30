import { Workload } from '@app/@generic/service/workload.service';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import { describe, expect, it, vi } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

import { run, runInWorkload } from '../../harness';

const nextTaskDelayMs = 0;

describe('sync/user-work-priority', () => {
    it('runs background work in queue order', async () => {
        const events: string[] = [];

        await Promise.all([
            runInWorkload(
                Effect.sync(() => {
                    events.push('background-one');
                })
            ),
            runInWorkload(
                Effect.sync(() => {
                    events.push('background-two');
                })
            )
        ]);

        expect(events).toEqual(['background-one', 'background-two']);
    });

    it('runs queued user work before older pending background work', async () => {
        const events: string[] = [];
        const queuedWork: Array<Promise<void>> = [];
        const currentStarted = Deferred.makeUnsafe<void>();
        const currentGate = Deferred.makeUnsafe<void>();

        const currentWork = runInWorkload(
            Effect.gen(function* () {
                events.push('current');
                yield* Deferred.succeed(currentStarted, undefined);
                yield* Deferred.await(currentGate);
            })
        ).then(emptyFn, () => {
            events.push('current:interrupted');
        });
        await run(Deferred.await(currentStarted));
        queuedWork.push(
            runInWorkload(
                Effect.sync(() => {
                    events.push('background');
                })
            ).then(emptyFn, () => {
                events.push('background:cancelled');
            })
        );
        queuedWork.push(
            run(
                Workload.use(workload =>
                    workload.runUser(
                        Effect.sync(() => {
                            events.push('file-import');
                        })
                    )
                )
            )
        );
        await vi.waitFor(async () => {
            expect(await run(Workload.use(workload => workload.hasQueuedUserWork))).toBe(true);
        });
        events.push('hasQueuedUserWork:true');
        Deferred.doneUnsafe(currentGate, Effect.void);
        await Promise.all([currentWork, ...queuedWork]);

        expect(events).toContain('background:cancelled');
        expect(events).toContain('file-import');
        expect(events).not.toContain('background');
        expect(events).not.toContain('current:interrupted');
        expect(events[0]).toBe('current');
        expect(events.indexOf('hasQueuedUserWork:true')).toBeLessThan(events.indexOf('file-import'));
    });

    it('rejects queued work immediately when pending work is cancelled', async () => {
        const events: string[] = [];
        const currentStarted = Deferred.makeUnsafe<void>();
        const currentGate = Deferred.makeUnsafe<void>();

        const runningWork = runInWorkload(
            Effect.gen(function* () {
                events.push('current');
                yield* Deferred.succeed(currentStarted, undefined);
                yield* Deferred.await(currentGate);
            })
        ).then(emptyFn, emptyFn);
        await run(Deferred.await(currentStarted));

        const queuedWorkRejected = runInWorkload(
            Effect.sync(() => {
                events.push('background');
            })
        ).then(
            () => false,
            () => true
        );

        await run(Workload.use(workload => workload.block));

        const isQueuedWorkRejected = await Promise.race([
            queuedWorkRejected,
            new Promise<false>(resolve => {
                setTimeout(() => {
                    resolve(false);
                }, nextTaskDelayMs);
            })
        ]);
        expect(isQueuedWorkRejected).toBe(true);

        Deferred.doneUnsafe(currentGate, Effect.void);
        await runningWork;
        expect(events).toEqual(['current']);
    });
});
