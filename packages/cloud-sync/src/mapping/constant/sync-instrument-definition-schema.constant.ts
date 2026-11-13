import { InstrumentPriceProviderEnum, InstrumentTypeEnum } from '@budgie/contracts';
import * as Schema from 'effect/Schema';

export const SYNC_INSTRUMENT_DEFINITION_SCHEMA = Schema.Struct({
    code: Schema.NonEmptyString,
    type: Schema.Enum(InstrumentTypeEnum),
    name: Schema.String,
    symbol: Schema.String,
    priceProvider: Schema.NullOr(Schema.Enum(InstrumentPriceProviderEnum)),
    providerInstrumentId: Schema.NullOr(Schema.String),
    quoteInstrumentCode: Schema.NullOr(Schema.NonEmptyString)
});
