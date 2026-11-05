import * as Context from 'effect/Context';

import type { AiInvokeError } from '@budgie/ai';
import type { Db, DbError } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';

export class SyncAutomationEmbeddingBoost extends Context.Service<
    SyncAutomationEmbeddingBoost,
    Effect.Effect<void, AiInvokeError | DbError, Db>
>()('@budgie/app/SyncAutomationEmbeddingBoost') {}
