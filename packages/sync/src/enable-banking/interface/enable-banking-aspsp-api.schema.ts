import * as Schema from 'effect/Schema';

const EnableBankingAspspApiSchema = Schema.Struct({
    name: Schema.String,
    country: Schema.String,
    logo: Schema.optional(Schema.NullOr(Schema.String)),
    maximum_consent_validity: Schema.Number,
    beta: Schema.optional(Schema.NullOr(Schema.Boolean)),
    required_psu_headers: Schema.optional(Schema.NullOr(Schema.Array(Schema.String)))
});

export const EnableBankingAspspListApiSchema = Schema.Struct({ aspsps: Schema.Array(EnableBankingAspspApiSchema) });
