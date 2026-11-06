import * as Schema from 'effect/Schema';

export const EnableBankingPendingAuthorizationSchema = Schema.Struct({
    state: Schema.String,
    applicationId: Schema.String,
    aspspName: Schema.String,
    aspspCountry: Schema.String,
    integrationId: Schema.NullOr(Schema.Finite),
    connectAccountId: Schema.NullOr(Schema.Finite),
    callbackUrl: Schema.String,
    expiresAtMs: Schema.Finite
});

export type EnableBankingPendingAuthorizationInterface = typeof EnableBankingPendingAuthorizationSchema.Type;
