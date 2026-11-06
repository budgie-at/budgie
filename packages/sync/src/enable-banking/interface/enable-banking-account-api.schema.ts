import * as Schema from 'effect/Schema';

const OptionalText = Schema.String.pipe(Schema.NullOr, Schema.optional);

export const EnableBankingAccountIdentificationApiSchema = Schema.Struct({ iban: OptionalText });

export const EnableBankingAccountApiSchema = Schema.Struct({
    account_id: EnableBankingAccountIdentificationApiSchema.pipe(Schema.NullOr, Schema.optional),
    name: OptionalText,
    product: OptionalText,
    cash_account_type: Schema.String,
    currency: Schema.String,
    identification_hash: Schema.String
});

export type EnableBankingAccountApiInterface = typeof EnableBankingAccountApiSchema.Type;
