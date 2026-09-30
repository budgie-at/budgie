import { Db } from '@budgie/contracts';
import { makeLoggerLayer } from '@budgie/logger';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import * as Atom from 'effect/reactivity/Atom';
import * as References from 'effect/References';

import { db } from '../drizzle/db/db';
import { Workload } from '../service/workload.service';
import { isLoggingEnabled } from '../utils/is-logging-enabled.util';

const appMemoMap = Layer.makeMemoMapUnsafe();

const appLayer = Workload.layer.pipe(
    Layer.provideMerge(
        Layer.mergeAll(
            Layer.succeed(Db, db),
            FetchHttpClient.layer,
            makeLoggerLayer(isLoggingEnabled()),
            Layer.succeed(References.TracerEnabled, isLoggingEnabled())
        )
    )
);

export const appRuntime = ManagedRuntime.make(appLayer, { memoMap: appMemoMap });

export const appAtomRuntime = Atom.context({ memoMap: appMemoMap })(appLayer);
