import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as FiberMap from 'effect/FiberMap';
import * as FiberSet from 'effect/FiberSet';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';
import * as Semaphore from 'effect/Semaphore';
import * as Stream from 'effect/Stream';
import * as SubscriptionRef from 'effect/SubscriptionRef';

export class Workload extends Context.Service<
    Workload,
    {
        readonly run: <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
        readonly runUser: <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
        readonly runForeground: <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
        readonly hasQueuedWork: Effect.Effect<boolean>;
        readonly interruptBackground: Effect.Effect<void>;
        readonly block: Effect.Effect<void>;
        readonly unblock: Effect.Effect<void>;
        readonly foregroundCount: SubscriptionRef.SubscriptionRef<number>;
        readonly awaitForegroundIdle: Effect.Effect<void>;
        readonly schedule: <A, E, R>(key: string, effect: Effect.Effect<A, E, R>) => Effect.Effect<void, never, R>;
        readonly cancelScheduled: (key: string) => Effect.Effect<void>;
    }
>()('@budgie/app/Workload') {
    static readonly layer = Layer.effect(
        Workload,
        Effect.gen(function* () {
            const lane = yield* Semaphore.make(1);
            const background = yield* FiberSet.make();
            const scheduled = yield* FiberMap.make<string>();
            const laneCount = yield* Ref.make(0);
            const isBlocked = yield* Ref.make(false);
            const foregroundCount = yield* SubscriptionRef.make(0);
            const interruptIfBlocked = Effect.flatMap(Ref.get(isBlocked), blocked => (blocked ? Effect.interrupt : Effect.void));
            const runForeground = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
                Effect.acquireUseRelease(
                    SubscriptionRef.update(foregroundCount, count => count + 1),
                    () => effect,
                    () => SubscriptionRef.update(foregroundCount, count => count - 1)
                );
            const runInLane = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
                Effect.andThen(
                    interruptIfBlocked,
                    Effect.acquireUseRelease(
                        Ref.update(laneCount, count => count + 1),
                        () => lane.withPermit(Effect.andThen(interruptIfBlocked, runForeground(effect))),
                        () => Ref.update(laneCount, count => count - 1)
                    )
                );

            return {
                run: effect =>
                    Effect.flatMap(FiberSet.run(background, runInLane(effect)), fiber =>
                        Effect.onInterrupt(Fiber.join(fiber), () => Fiber.interrupt(fiber))
                    ),
                runUser: effect => Effect.andThen(FiberSet.clear(background), runInLane(effect)),
                runForeground,
                hasQueuedWork: Effect.map(Ref.get(laneCount), count => count > 1),
                interruptBackground: FiberSet.clear(background),
                block: Effect.andThen(Ref.set(isBlocked, true), FiberSet.clear(background)),
                unblock: Ref.set(isBlocked, false),
                foregroundCount,
                awaitForegroundIdle: Stream.runDrain(Stream.takeUntil(SubscriptionRef.changes(foregroundCount), count => count === 0)),
                schedule: (key, effect) => Effect.asVoid(FiberMap.run(scheduled, key, effect, { onlyIfMissing: true })),
                cancelScheduled: key => FiberMap.remove(scheduled, key)
            };
        })
    );
}
