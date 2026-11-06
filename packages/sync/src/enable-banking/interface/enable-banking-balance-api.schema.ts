import * as Schema from 'effect/Schema';

import { EnableBankingAmountApiSchema } from './enable-banking-amount-api.schema';

const EnableBankingBalanceApiSchema = Schema.Struct({
    balance_amount: EnableBankingAmountApiSchema,
    balance_type: Schema.String,
    last_change_date_time: Schema.String.pipe(Schema.NullOr, Schema.optional),
    reference_date: Schema.String.pipe(Schema.NullOr, Schema.optional)
});

export const EnableBankingBalanceListApiSchema = Schema.Struct({ balances: Schema.Array(EnableBankingBalanceApiSchema) });

export type EnableBankingBalanceApiInterface = typeof EnableBankingBalanceApiSchema.Type;
