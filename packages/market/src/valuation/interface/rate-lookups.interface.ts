import type { CurrencyEnum, Db, DbError, InstrumentEntityInterface } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';

export interface RateLookupsInterface {
    readonly findForDateOrBefore: (
        sourceInstrumentId: number,
        targetInstrumentId: number,
        rateDate: string
    ) => Effect.Effect<{ readonly rate: number } | undefined, DbError, Db>;
    readonly findEarliest: (
        sourceInstrumentId: number,
        targetInstrumentId: number
    ) => Effect.Effect<{ readonly rate: number } | undefined, DbError, Db>;
    readonly findLatest: (
        sourceInstrumentId: number,
        targetInstrumentId: number
    ) => Effect.Effect<{ readonly rate: number } | undefined, DbError, Db>;
    readonly findInstrumentByCode: (code: CurrencyEnum) => Effect.Effect<InstrumentEntityInterface | undefined, DbError, Db>;
}
