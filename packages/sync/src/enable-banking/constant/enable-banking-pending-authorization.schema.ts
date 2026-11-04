import * as Schema from 'effect/Schema';

export const EnableBankingPendingAuthorizationSchema = Schema.Struct({
    state: Schema.String,
    applicationId: Schema.String,
    aspspName: Schema.String,
    aspspCountry: Schema.String,
    integrationId: Schema.NullOr(Schema.Number),
    callbackUrl: Schema.String,
    expiresAtMs: Schema.Number
});

export type EnableBankingPendingAuthorizationInterface = typeof EnableBankingPendingAuthorizationSchema.Type;
