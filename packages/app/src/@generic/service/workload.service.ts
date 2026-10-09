import * as Context from 'effect/Context';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as FiberMap from 'effect/FiberMap';
import * as FiberSet from 'effect/FiberSet';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';
import * as Semaphore from 'effect/Semaphore';
import * as Stream from 'effect/Stream';
import * as SubscriptionRef from 'effect/SubscriptionRef';

import type { Db } from '@budgie/contracts';
import type * as HttpClient from 'effect/http/HttpClient';

export class Workload extends Context.Service<
    Workload,
    {
        readonly run: <A, E>(effect: Effect.Effect<A, E, Db | HttpClient.HttpClient | Workload>) => Effect.Effect<A, E>;
        readonly runUser: <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
        readonly runForeground: <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
        readonly runScheduled: <A, E>(
            effect: Effect.Effect<A, E, Db | HttpClient.HttpClient | Workload>
        ) => Effect.Effect<A, E, Db | HttpClient.HttpClient>;
        readonly scheduleBackground: <A, E>(
            key: string,
            effect: Effect.Effect<A, E, Db | HttpClient.HttpClient | Workload>
        ) => Effect.Effect<void>;
        readonly hasQueuedWork: Effect.Effect<boolean>;
        readonly hasQueuedUserWork: Effect.Effect<boolean>;
        readonly awaitQueuedUserWork: Effect.Effect<void>;
        readonly interruptBackground: Effect.Effect<void>;
        readonly block: Effect.Effect<void>;
        readonly unblock: Effect.Effect<void>;
        readonly foregroundCount: SubscriptionRef.SubscriptionRef<number>;
        readonly awaitForegroundIdle: Effect.Effect<void>;
        readonly schedule: <A, E>(
            key: string,
            effect: Effect.Effect<A, E, Db | HttpClient.HttpClient | Workload>,
            options?: { readonly replace?: boolean }
        ) => Effect.Effect<void>;
        readonly cancelScheduled: (key: string) => Effect.Effect<void>;
    }
>()('@budgie/app/Workload') {
    static readonly layer = Layer.effect(
        Workload,
        Effect.gen(function* () {
            const [lane, laneCount, isBlocked, queuedBackground, queuedUser, foregroundCount] = yield* Effect.all([
                Semaphore.make(1),
                Ref.make(0),
                Ref.make(false),
                SubscriptionRef.make<ReadonlySet<Deferred.Deferred<Fiber.Fiber<unknown, unknown>>>>(new Set()),
                SubscriptionRef.make<ReadonlySet<Fiber.Fiber<unknown, unknown>>>(new Set()),
                SubscriptionRef.make(0)
            ]);
            const runBackground = yield* FiberSet.runtime(yield* FiberSet.make())<Db | HttpClient.HttpClient>();
            const scheduled = yield* FiberMap.make<string>();
            const scheduledBackground = yield* FiberMap.make<string>();
            const runScheduled = yield* FiberMap.runtime(scheduled)<Db | HttpClient.HttpClient>();
            const runScheduledBackground = yield* FiberMap.runtime(scheduledBackground)<Db | HttpClient.HttpClient>();
            const interruptIfBlocked = Effect.flatMap(Ref.get(isBlocked), blocked => (blocked ? Effect.interrupt : Effect.void));
            const interruptQueuedBackground = Effect.flatMap(SubscriptionRef.getAndSet(queuedBackground, new Set()), tokens =>
                Effect.forEach(tokens, token => Effect.flatMap(Deferred.await(token), Fiber.interrupt), { discard: true })
            );
            const runForeground = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
                Effect.acquireUseRelease(
                    SubscriptionRef.update(foregroundCount, count => count + 1),
                    () => effect,
                    () => SubscriptionRef.update(foregroundCount, count => count - 1)
                );
            const runInLane = <A, E, R>(effect: Effect.Effect<A, E, R>, onPermit: Effect.Effect<void>) =>
                Effect.andThen(
                    interruptIfBlocked,
                    Effect.acquireUseRelease(
                        Ref.update(laneCount, count => count + 1),
                        () => lane.withPermit(Effect.andThen(Effect.andThen(onPermit, interruptIfBlocked), runForeground(effect))),
                        () => Ref.update(laneCount, count => count - 1)
                    )
                );
            const workload = Workload.of({
                run: effect =>
                    Effect.flatMap(Deferred.make<Fiber.Fiber<unknown, unknown>>(), token =>
                        Effect.flatMap(
                            Effect.uninterruptible(
                                SubscriptionRef.update(queuedBackground, tokens => new Set([...tokens, token])).pipe(
                                    Effect.andThen(
                                        Effect.sync(() =>
                                            runBackground(
                                                runInLane(
                                                    Effect.provideService(effect, Workload, workload),
                                                    Effect.flatMap(Workload.dequeue(queuedBackground, token), isQueued =>
                                                        isQueued ? Effect.void : Effect.interrupt
                                                    )
                                                ).pipe(Effect.ensuring(Workload.dequeue(queuedBackground, token)))
                                            )
                                        )
                                    ),
                                    Effect.tap(fiber => Deferred.succeed(token, fiber))
                                )
                            ),
                            fiber => Effect.onInterrupt(Fiber.join(fiber), () => Fiber.interrupt(fiber))
                        )
                    ),
                runUser: effect =>
                    Effect.andThen(
                        interruptQueuedBackground,
                        Effect.withFiber(fiber =>
                            Effect.andThen(
                                SubscriptionRef.update(queuedUser, fibers => new Set([...fibers, fiber])),
                                runInLane(effect, Effect.asVoid(Workload.dequeue(queuedUser, fiber))).pipe(
                                    Effect.ensuring(Workload.dequeue(queuedUser, fiber))
                                )
                            )
                        )
                    ),
                runForeground,
                runScheduled: effect => runInLane(Effect.provideService(effect, Workload, workload), Effect.void),
                hasQueuedWork: Effect.map(Ref.get(laneCount), count => count > 1),
                hasQueuedUserWork: Effect.map(SubscriptionRef.get(queuedUser), fibers => fibers.size > 0),
                awaitQueuedUserWork: Stream.runDrain(Stream.takeUntil(SubscriptionRef.changes(queuedUser), fibers => fibers.size > 0)),
                interruptBackground: Effect.andThen(interruptQueuedBackground, FiberMap.clear(scheduledBackground)),
                block: Effect.andThen(
                    Ref.set(isBlocked, true),
                    Effect.andThen(interruptQueuedBackground, FiberMap.clear(scheduledBackground))
                ),
                unblock: Ref.set(isBlocked, false),
                foregroundCount,
                awaitForegroundIdle: Stream.runDrain(Stream.takeUntil(SubscriptionRef.changes(foregroundCount), count => count === 0)),
                schedule: (key, effect, options) =>
                    Effect.sync(() => {
                        runScheduled(key, Effect.provideService(effect, Workload, workload), { onlyIfMissing: options?.replace !== true });
                    }),
                scheduleBackground: (key, effect) =>
                    Effect.sync(() => {
                        runScheduledBackground(key, Effect.provideService(effect, Workload, workload), { onlyIfMissing: true });
                    }),
                cancelScheduled: key => FiberMap.remove(scheduled, key)
            });

            return workload;
        })
    );

    private static dequeue<T>(queue: SubscriptionRef.SubscriptionRef<ReadonlySet<T>>, token: T): Effect.Effect<boolean> {
        return SubscriptionRef.modify(
            queue,
            tokens => [tokens.has(token), new Set([...tokens].filter(queued => queued !== token))] as const
        );
    }
}
