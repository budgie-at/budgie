import * as Schema from 'effect/Schema';

export const SecurityTradeFormSchema = Schema.Struct({
    quantity: Schema.Finite.check(Schema.isGreaterThan(0)),
    price: Schema.Finite.check(Schema.isGreaterThan(0)),
    fee: Schema.Finite.check(Schema.isGreaterThanOrEqualTo(0)),
    total: Schema.optionalKey(Schema.Finite.check(Schema.isGreaterThanOrEqualTo(0))),
    operatedAt: Schema.Date
});

export type SecurityTradeFormValues = typeof SecurityTradeFormSchema.Type;
