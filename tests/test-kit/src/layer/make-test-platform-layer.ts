import { Db } from '@budgie/contracts';
import * as FetchHttpClient from 'effect/http/FetchHttpClient';
import * as Layer from 'effect/Layer';
import * as Logger from 'effect/Logger';
import * as Reactivity from 'effect/reactivity/Reactivity';

import type { DB } from '@budgie/contracts';

export const makeTestPlatformLayer = (database: DB) =>
    Layer.mergeAll(Layer.succeed(Db, database), FetchHttpClient.layer, Logger.layer([]), Reactivity.layer);
