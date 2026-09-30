import { Workload } from '@app/@generic/service/workload.service';
import * as Effect from 'effect/Effect';

const SCHEDULER_TURNS = 10;

export const skipRequestedSync = Effect.fnUntraced(function* <A, E, R>(action: Effect.Effect<A, E, R>) {
    const workload = yield* Workload;

    yield* workload.block;
    const result = yield* action;
    yield* Effect.forEach(Array.from({ length: SCHEDULER_TURNS }), () => Effect.yieldNow, { discard: true });
    yield* workload.unblock;

    return result;
});
