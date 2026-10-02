import * as Context from 'effect/Context';

import type { AccountEntityInterface, Db } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';

export class RuleHost extends Context.Service<
    RuleHost,
    {
        readonly refreshBalances: Effect.Effect<void, Error, Db>;
        readonly assertTransferAccountsAllowed: (accounts: readonly Pick<AccountEntityInterface, 'type'>[]) => Effect.Effect<void, Error>;
    }
>()('@budgie/rules/RuleHost') {}
