import * as Schema from 'effect/Schema';

import { EnableBankingAmountApiSchema } from './enable-banking-amount-api.schema';

const EnableBankingBalanceApiSchema = Schema.Struct({
    balance_amount: EnableBankingAmountApiSchema,
    balance_type: Schema.String,
    last_change_date_time: Schema.optional(Schema.NullOr(Schema.String)),
    reference_date: Schema.optional(Schema.NullOr(Schema.String))
});

export const EnableBankingBalanceListApiSchema = Schema.Struct({ balances: Schema.Array(EnableBankingBalanceApiSchema) });

export type EnableBankingBalanceApiInterface = typeof EnableBankingBalanceApiSchema.Type;
