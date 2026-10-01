import { Db } from '@budgie/contracts';
import { makeLoggerLayer } from '@budgie/logger';
import * as Effect from 'effect/Effect';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import * as Atom from 'effect/reactivity/Atom';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as References from 'effect/References';

import { DatabaseChangeService } from '../drizzle/service/database-change.service';
import { DatabaseConnectionService } from '../drizzle/service/database-connection.service';
import { isLoggingEnabled } from '../utils/is-logging-enabled.util';

import { appServicesLayer } from './app-services.layer';

const appMemoMap = Layer.makeMemoMapUnsafe();

const platformLayer = Layer.mergeAll(
    Layer.effect(
        Db,
        Effect.map(DatabaseConnectionService, databaseConnectionService => databaseConnectionService.db)
    ).pipe(Layer.provideMerge(DatabaseConnectionService.layer)),
    FetchHttpClient.layer,
    makeLoggerLayer(isLoggingEnabled()),
    Layer.succeed(References.TracerEnabled, isLoggingEnabled()),
    Layer.effect(
        Db.TransactionBoundary,
        Effect.map(DatabaseChangeService, databaseChangeService => databaseChangeService.transactionBoundary)
    ).pipe(Layer.provideMerge(DatabaseChangeService.layer))
).pipe(Layer.provideMerge(Reactivity.layer));

const appLayer = appServicesLayer.pipe(Layer.provideMerge(platformLayer));

export const appRuntime = ManagedRuntime.make(appLayer, { memoMap: appMemoMap });

export const appAtomRuntime = Atom.context({ memoMap: appMemoMap })(appLayer);

export type AppServices = ManagedRuntime.ManagedRuntime.Services<typeof appRuntime>;
