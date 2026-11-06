import { Db, makeLoggerLayer } from '@budgie/contracts';
import { installE2eFakeApi } from '@budgie/sync/e2e';
import * as Effect from 'effect/Effect';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import * as Atom from 'effect/reactivity/Atom';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as References from 'effect/References';
import Constants from 'expo-constants';

import { syncRequestSignerLayer } from '../../sync/layer/sync-request-signer.layer';
import { DatabaseChangeService } from '../drizzle/service/database-change.service';
import { DatabaseConnectionService } from '../drizzle/service/database-connection.service';
import { isLoggingEnabled } from '../utils/is-logging-enabled.util';

import { appServicesLayer } from './app-services.layer';

if (Constants.expoConfig?.extra?.['appVariant'] === 'e2e') {
    installE2eFakeApi();
}

const appMemoMap = Layer.makeMemoMapUnsafe();

const platformLayer = Layer.mergeAll(
    Layer.effect(
        Db,
        Effect.map(DatabaseConnectionService, databaseConnectionService => databaseConnectionService.db)
    ).pipe(Layer.provideMerge(DatabaseConnectionService.layer)),
    FetchHttpClient.layer,
    syncRequestSignerLayer,
    makeLoggerLayer(isLoggingEnabled()),
    Layer.succeed(References.TracerEnabled, isLoggingEnabled()),
    Layer.effect(
        Db.TransactionBoundary,
        Effect.map(DatabaseChangeService, databaseChangeService => databaseChangeService.transactionBoundary)
    ).pipe(Layer.provideMerge(DatabaseChangeService.layer))
).pipe(Layer.provideMerge(Reactivity.layer));

const appLayer = appServicesLayer.pipe(Layer.provideMerge(platformLayer));

export const appRuntime = ManagedRuntime.make(appLayer, { memoMap: appMemoMap });

export const appAtomRuntime = appRuntime.contextEffect.pipe(Layer.effectContext, Atom.context({ memoMap: appMemoMap }));

export type AppServices = ManagedRuntime.ManagedRuntime.Services<typeof appRuntime>;
