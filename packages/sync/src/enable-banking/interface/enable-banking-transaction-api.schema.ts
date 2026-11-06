import * as Schema from 'effect/Schema';

import { EnableBankingAccountIdentificationApiSchema } from './enable-banking-account-api.schema';
import { EnableBankingAmountApiSchema } from './enable-banking-amount-api.schema';

const OptionalText = Schema.String.pipe(Schema.NullOr, Schema.optional);
const PartySchema = Schema.Struct({ name: OptionalText }).pipe(Schema.NullOr, Schema.optional);
const PartyAccountSchema = EnableBankingAccountIdentificationApiSchema.pipe(Schema.NullOr, Schema.optional);

const EnableBankingTransactionApiSchema = Schema.Struct({
    entry_reference: OptionalText,
    merchant_category_code: OptionalText,
    transaction_amount: EnableBankingAmountApiSchema,
    creditor: PartySchema,
    creditor_account: PartyAccountSchema,
    debtor: PartySchema,
    debtor_account: PartyAccountSchema,
    credit_debit_indicator: Schema.String,
    status: Schema.String,
    booking_date: OptionalText,
    value_date: OptionalText,
    remittance_information: Schema.String.pipe(Schema.Array, Schema.NullOr, Schema.optional)
});

export const EnableBankingTransactionPageApiSchema = Schema.Struct({
    transactions: Schema.Array(EnableBankingTransactionApiSchema),
    continuation_key: OptionalText
});

export type EnableBankingTransactionApiInterface = typeof EnableBankingTransactionApiSchema.Type;
