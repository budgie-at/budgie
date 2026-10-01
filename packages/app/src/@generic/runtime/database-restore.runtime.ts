import { makeLoggerLayer } from '@budgie/logger';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import * as Reactivity from 'effect/reactivity/Reactivity';

import { DatabaseRestoreService } from '../drizzle/service/database-restore.service';
import { isLoggingEnabled } from '../utils/is-logging-enabled.util';

export const databaseRestoreRuntime = ManagedRuntime.make(
    DatabaseRestoreService.layer.pipe(Layer.provideMerge(Layer.mergeAll(makeLoggerLayer(isLoggingEnabled()), Reactivity.layer)))
);
