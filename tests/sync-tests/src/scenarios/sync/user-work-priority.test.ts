import { Workload } from '@app/@generic/service/workload.service';
import { describe, expect, it } from '@effect/vitest';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Fiber from 'effect/Fiber';
import * as Option from 'effect/Option';
import * as Schedule from 'effect/Schedule';

import { inWorkload, TestLayer } from '../../harness';

const nextTaskDelayMs = 0;

const makeGatedWork = Effect.fnUntraced(function* (events: string[]) {
    const started = yield* Deferred.make<void>();
    const gate = yield* Deferred.make<void>();

    return {
        work: inWorkload(
            Effect.gen(function* () {
                events.push('current');
                yield* Deferred.succeed(started, undefined);
                yield* Deferred.await(gate);
            })
        ),
        awaitStarted: Deferred.await(started),
        release: Deferred.succeed(gate, undefined)
    };
});

describe('sync/user-work-priority', () => {
    it.effect('runs background work in queue order', () =>
        Effect.gen(function* () {
            const events: string[] = [];

            yield* Effect.all(
                [
                    inWorkload(
                        Effect.sync(() => {
                            events.push('background-one');
                        })
                    ),
                    inWorkload(
                        Effect.sync(() => {
                            events.push('background-two');
                        })
                    )
                ],
                { concurrency: 'unbounded' }
            );

            expect(events).toEqual(['background-one', 'background-two']);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('runs queued user work before older pending background work', () =>
        Effect.gen(function* () {
            const workload = yield* Workload;
            const events: string[] = [];
            const gatedWork = yield* makeGatedWork(events);

            const currentWork = yield* Effect.forkChild(
                gatedWork.work.pipe(
                    Effect.catchCause(() =>
                        Effect.sync(() => {
                            events.push('current:interrupted');
                        })
                    )
                )
            );
            yield* gatedWork.awaitStarted;
            const backgroundWork = yield* Effect.forkChild(
                inWorkload(
                    Effect.sync(() => {
                        events.push('background');
                    })
                ).pipe(
                    Effect.catchCause(() =>
                        Effect.sync(() => {
                            events.push('background:cancelled');
                        })
                    )
                )
            );
            const fileImportWork = yield* Effect.forkChild(
                workload.runUser(
                    Effect.sync(() => {
                        events.push('file-import');
                    })
                )
            );
            yield* workload.hasQueuedUserWork.pipe(
                Effect.repeat({ until: isQueued => isQueued, schedule: Schedule.spaced('1 millis') }),
                Effect.timeout('5 seconds')
            );
            events.push('hasQueuedUserWork:true');
            yield* gatedWork.release;
            yield* Fiber.joinAll([currentWork, backgroundWork, fileImportWork]);

            expect(events).toContain('background:cancelled');
            expect(events).toContain('file-import');
            expect(events).not.toContain('background');
            expect(events).not.toContain('current:interrupted');
            expect(events[0]).toBe('current');
            expect(events.indexOf('hasQueuedUserWork:true')).toBeLessThan(events.indexOf('file-import'));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects queued work immediately when pending work is cancelled', () =>
        Effect.gen(function* () {
            const workload = yield* Workload;
            const events: string[] = [];
            const gatedWork = yield* makeGatedWork(events);

            const runningWork = yield* Effect.forkChild(Effect.exit(gatedWork.work));
            yield* gatedWork.awaitStarted;

            const queuedWorkRejected = yield* Effect.forkChild(
                Effect.exit(
                    inWorkload(
                        Effect.sync(() => {
                            events.push('background');
                        })
                    )
                ).pipe(Effect.map(Exit.isFailure))
            );

            yield* workload.block;

            const isQueuedWorkRejected = yield* Fiber.join(queuedWorkRejected).pipe(
                Effect.timeoutOption(nextTaskDelayMs),
                Effect.map(Option.getOrElse(() => false))
            );
            expect(isQueuedWorkRejected).toBe(true);

            yield* gatedWork.release;
            yield* Fiber.join(runningWork);
            expect(events).toEqual(['current']);
        }).pipe(Effect.provide(TestLayer))
    );
});
