import * as Context from 'effect/Context';

import type { Db, DbError } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';

export class SyncAutomationYieldTagRepair extends Context.Service<
    SyncAutomationYieldTagRepair,
    (transactionSyncIds: readonly string[]) => Effect.Effect<void, DbError, Db>
>()('@budgie/cloud-sync/SyncAutomationYieldTagRepair') {}
