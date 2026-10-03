import * as Schema from 'effect/Schema';

import type { Mutable } from 'effect/Types';

const RequiredColumnSchema = Schema.String.check(Schema.isMinLength(1));

export const ImportColumnMapSchema = Schema.Struct({
    toAccount: RequiredColumnSchema,
    category: RequiredColumnSchema,
    operatedAt: RequiredColumnSchema,
    toAmount: RequiredColumnSchema,
    toCurrency: RequiredColumnSchema,
    externalId: Schema.String,
    fromAccount: Schema.String,
    fromCurrency: Schema.String,
    fromAmount: Schema.String,
    comment: Schema.String,
    isPlanned: Schema.String,
    mcc: Schema.String
});

export type ImportColumnMapFormValues = Mutable<typeof ImportColumnMapSchema.Type>;
