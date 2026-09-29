import * as Semaphore from 'effect/Semaphore';

import type * as Effect from 'effect/Effect';
import type * as Option from 'effect/Option';

class DrainerMutexService {
    private readonly semaphore = Semaphore.makeUnsafe(1);

    runExclusive<A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<Option.Option<A>, E, R> {
        return this.semaphore.withPermitsIfAvailable(1)(effect);
    }
}

export const drainerMutex = new DrainerMutexService();
