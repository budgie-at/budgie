import * as Context from 'effect/Context';

import type { DbError, Db } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';

export class SyncAccountBalanceRefresher extends Context.Service<
    SyncAccountBalanceRefresher,
    { readonly refresh: (accountIds: readonly number[]) => Effect.Effect<void, DbError, Db> }
>()('@budgie/cloud-sync/SyncAccountBalanceRefresher') {}
