import { SyncAccountBalanceRefresher } from '@budgie/cloud-sync';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

export const syncAccountBalanceRefresherLayer = Layer.effect(
    SyncAccountBalanceRefresher,
    Effect.map(AccountBalanceIncrementalService, accountBalanceIncrementalService => ({
        refresh: (accountIds: readonly number[]) =>
            accountBalanceIncrementalService
                .updateBalancesByAccountIds([...accountIds])
                .pipe(Effect.catchTags({ DepositNegativeBalanceError: () => Effect.void, AccountNotFoundError: () => Effect.void }))
    }))
).pipe(Layer.provide(AccountBalanceIncrementalService.layer));
