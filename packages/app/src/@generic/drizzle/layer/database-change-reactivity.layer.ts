import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { DatabaseChangeService } from '../service/database-change.service';

export const databaseChangeReactivityLayer = Layer.effect(
    Db.TransactionBoundary,
    Effect.map(DatabaseChangeService, databaseChangeService => databaseChangeService.transactionBoundary)
).pipe(Layer.provideMerge(DatabaseChangeService.layer));
