import * as Schema from 'effect/Schema';

const EnableBankingAspspApiSchema = Schema.Struct({
    name: Schema.String,
    country: Schema.String,
    maximum_consent_validity: Schema.Finite,
    psu_types: Schema.String.pipe(Schema.Array, Schema.optional),
    beta: Schema.Boolean.pipe(Schema.NullOr, Schema.optional),
    required_psu_headers: Schema.String.pipe(Schema.Array, Schema.NullOr, Schema.optional)
});

export const EnableBankingAspspListApiSchema = Schema.Struct({ aspsps: Schema.Array(EnableBankingAspspApiSchema) });
