import * as Schema from 'effect/Schema';

const OptionalText = Schema.optional(Schema.NullOr(Schema.String));

export const EnableBankingAccountIdentificationApiSchema = Schema.Struct({ iban: OptionalText });

export const EnableBankingAccountApiSchema = Schema.Struct({
    account_id: Schema.optional(Schema.NullOr(EnableBankingAccountIdentificationApiSchema)),
    name: OptionalText,
    product: OptionalText,
    cash_account_type: Schema.String,
    currency: Schema.String,
    identification_hash: Schema.String
});

export type EnableBankingAccountApiInterface = typeof EnableBankingAccountApiSchema.Type;
