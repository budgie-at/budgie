import { Db } from '@budgie/contracts';
import { makeLoggerLayer } from '@budgie/logger';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';

import { db } from '../drizzle/db/db';
import { Workload } from '../service/workload.service';
import { isLoggingEnabled } from '../utils/is-logging-enabled.util';

export const appRuntime = ManagedRuntime.make(
    Layer.mergeAll(Layer.succeed(Db, db), FetchHttpClient.layer, makeLoggerLayer(isLoggingEnabled()), Workload.layer)
);
