import { Workload } from '@app/@generic/service/workload.service';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';

export const pauseUserWork = Effect.fnUntraced(function* <E, R>(onStart: Effect.Effect<void, E, R>) {
    const started = yield* Deferred.make<void>();
    const released = yield* Deferred.make<void>();
    const work = yield* Effect.forkChild(
        Workload.use(workload =>
            workload.runUser(onStart.pipe(Effect.andThen(Deferred.succeed(started, undefined)), Effect.andThen(Deferred.await(released))))
        )
    );

    yield* Deferred.await(started);

    return Effect.andThen(Deferred.succeed(released, undefined), Fiber.join(work));
});
