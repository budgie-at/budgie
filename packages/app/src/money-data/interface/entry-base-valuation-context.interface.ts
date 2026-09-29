import type { AccountEntityInterface, Db, DbError, InstrumentEntityInterface } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';

export interface EntryBaseValuationContextInterface {
    readonly baseInstrument: InstrumentEntityInterface | undefined;
    readonly accounts: Map<number, Effect.Effect<Pick<AccountEntityInterface, 'instrumentId' | 'type'> | undefined, DbError, Db>>;
    readonly rates: Map<string, Effect.Effect<number | null, DbError, Db>>;
}
