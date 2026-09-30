import type { EntryBaseValuationRateKeyType } from '../type/entry-base-valuation-rate-key.type';
import type { AccountWithInstrumentEntityInterface, DbError, InstrumentEntityInterface } from '@budgie/contracts';
import type * as Cache from 'effect/Cache';

export interface EntryBaseValuationContextInterface {
    readonly baseInstrument: InstrumentEntityInterface | undefined;
    readonly accounts: Cache.Cache<number, AccountWithInstrumentEntityInterface | undefined, DbError>;
    readonly rates: Cache.Cache<EntryBaseValuationRateKeyType, number | null, DbError>;
}
