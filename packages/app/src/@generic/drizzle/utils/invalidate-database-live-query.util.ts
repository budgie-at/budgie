import * as Effect from 'effect/Effect';

import { databaseRefreshService } from '../../service/database-refresh.service';

export const invalidateDatabaseLiveQuery = <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    Effect.tap(effect, () => Effect.sync(() => databaseRefreshService.notifyChanged()));
