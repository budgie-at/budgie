import * as Schema from 'effect/Schema';

export const EnableBankingAmountApiSchema = Schema.Struct({ amount: Schema.String, currency: Schema.String });
