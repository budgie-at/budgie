import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { DatabaseConnectionService } from '../service/database-connection.service';

export const databaseLayer = Layer.effect(
    Db,
    Effect.map(DatabaseConnectionService, databaseConnectionService => databaseConnectionService.db)
).pipe(Layer.provideMerge(DatabaseConnectionService.layer));
