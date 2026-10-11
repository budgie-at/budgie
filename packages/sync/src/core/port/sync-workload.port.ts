import * as Context from 'effect/Context';

import type { ConsolidationScanScopeInterface, Db, TransactionCreateInputInterface } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';
import type * as HttpClient from 'effect/http/HttpClient';

export class SyncWorkload extends Context.Service<
    SyncWorkload,
    {
        readonly run: <A, E>(effect: Effect.Effect<A, E, Db | HttpClient.HttpClient>) => Effect.Effect<A, E>;
        readonly runUser: <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
        readonly runScheduled: <A, E>(
            effect: Effect.Effect<A, E, Db | HttpClient.HttpClient>
        ) => Effect.Effect<A, E, Db | HttpClient.HttpClient>;
        readonly schedule: <A, E>(key: string, effect: Effect.Effect<A, E, Db | HttpClient.HttpClient>) => Effect.Effect<void>;
        readonly hasQueuedWork: Effect.Effect<boolean>;
        readonly hasQueuedUserWork: Effect.Effect<boolean>;
        readonly awaitQueuedUserWork: Effect.Effect<void>;
        readonly enqueueRuleApplication: (
            transactionIds: number[],
            transactionInputs: TransactionCreateInputInterface[]
        ) => Effect.Effect<void>;
        readonly enqueueTransferConsolidation: (scope?: ConsolidationScanScopeInterface | null) => Effect.Effect<void>;
    }
>()('@budgie/sync/SyncWorkload') {}
