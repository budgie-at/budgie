import { Db } from '@budgie/contracts';
import { makeLoggerLayer } from '@budgie/logger';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import * as Atom from 'effect/reactivity/Atom';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as References from 'effect/References';

import { db } from '../drizzle/db/db';
import { databaseChangeReactivityLayer } from '../drizzle/layer/database-change-reactivity.layer';
import { isLoggingEnabled } from '../utils/is-logging-enabled.util';

import { appServicesLayer } from './app-services.layer';

const appMemoMap = Layer.makeMemoMapUnsafe();

const platformLayer = Layer.mergeAll(
    Layer.succeed(Db, db),
    FetchHttpClient.layer,
    makeLoggerLayer(isLoggingEnabled()),
    Layer.succeed(References.TracerEnabled, isLoggingEnabled()),
    databaseChangeReactivityLayer
).pipe(Layer.provideMerge(Reactivity.layer));

const appLayer = appServicesLayer.pipe(Layer.provideMerge(platformLayer));

export const appRuntime = ManagedRuntime.make(appLayer, { memoMap: appMemoMap });

export const appAtomRuntime = Atom.context({ memoMap: appMemoMap })(appLayer);

export type AppServices = ManagedRuntime.ManagedRuntime.Services<typeof appRuntime>;
