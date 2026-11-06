import * as Context from 'effect/Context';

import type { DbError } from '../../../@generic/error/db.error';
import type { Db } from '../../../@generic/service/db.service';
import type * as Effect from 'effect/Effect';

export class SyncAccountBalanceRefresher extends Context.Service<
    SyncAccountBalanceRefresher,
    { readonly refresh: (accountIds: readonly number[]) => Effect.Effect<void, DbError, Db> }
>()('@budgie/contracts/SyncAccountBalanceRefresher') {}
