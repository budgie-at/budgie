import type { ResolvedBaseRateInterface } from './resolved-base-rate.interface';
import type { AccountWithInstrumentEntityInterface, DbError, InstrumentEntityInterface } from '@budgie/contracts';
import type * as Cache from 'effect/Cache';

export interface EntryBaseValuationContextInterface {
    readonly baseInstrument: InstrumentEntityInterface | undefined;
    readonly accounts: Cache.Cache<number, AccountWithInstrumentEntityInterface | undefined, DbError>;
    readonly rates: Cache.Cache<readonly [accountId: number, rateDate: string], ResolvedBaseRateInterface | null, DbError>;
}
