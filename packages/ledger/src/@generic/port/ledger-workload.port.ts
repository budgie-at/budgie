import * as Context from 'effect/Context';

import type * as Effect from 'effect/Effect';

export class LedgerWorkload extends Context.Service<
    LedgerWorkload,
    {
        readonly runForeground: <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
    }
>()('@budgie/ledger/LedgerWorkload') {}
