import * as Context from 'effect/Context';

import type { AccountEntityInterface, Db, TransactionEntryCreateEntityInterface } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';

export class RuleHost extends Context.Service<
    RuleHost,
    {
        readonly convertAmount: (
            fromInstrumentId: number,
            toInstrumentId: number,
            amountInMicroUnits: number
        ) => Effect.Effect<{ readonly amount: number; readonly exchangeRate: number }, Error, Db>;
        readonly valueEntry: (
            accountId: number,
            amountInMicroUnits: number,
            operatedAt: Date
        ) => Effect.Effect<Pick<TransactionEntryCreateEntityInterface, 'baseInstrumentId' | 'baseExchangeRate' | 'baseAmount'>, Error, Db>;
        readonly refreshBalances: Effect.Effect<void, Error, Db>;
        readonly assertTransferAccountsAllowed: (accounts: readonly Pick<AccountEntityInterface, 'type'>[]) => Effect.Effect<void, Error>;
    }
>()('@budgie/rules/RuleHost') {}
