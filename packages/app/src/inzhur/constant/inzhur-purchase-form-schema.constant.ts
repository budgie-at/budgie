import * as Schema from 'effect/Schema';

export const InzhurPurchaseFormSchema = Schema.Struct({
    fundName: Schema.String.check(Schema.isMinLength(1)),
    certificates: Schema.Number.check(Schema.isInt(), Schema.isGreaterThan(0)),
    amount: Schema.Finite.check(Schema.isGreaterThan(0)),
    operatedAt: Schema.Date
});

export type InzhurPurchaseFormValues = typeof InzhurPurchaseFormSchema.Type;
