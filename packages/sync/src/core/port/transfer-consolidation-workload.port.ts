import * as Context from 'effect/Context';

import type { Db } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';
import type * as HttpClient from 'effect/http/HttpClient';

export class TransferConsolidationWorkload extends Context.Service<
    TransferConsolidationWorkload,
    {
        readonly run: <A, E>(effect: Effect.Effect<A, E, Db | HttpClient.HttpClient>) => Effect.Effect<A, E>;
        readonly schedule: <A, E>(key: string, effect: Effect.Effect<A, E, Db | HttpClient.HttpClient>) => Effect.Effect<void>;
        readonly cancelScheduled: (key: string) => Effect.Effect<void>;
        readonly awaitForegroundIdle: Effect.Effect<void>;
        readonly awaitIdle: Effect.Effect<void>;
    }
>()('@budgie/sync/TransferConsolidationWorkload') {}
