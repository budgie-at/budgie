import * as Schema from 'effect/Schema';

export const EnableBankingTokenSchema = Schema.Struct({
    applicationId: Schema.NonEmptyString,
    sessionId: Schema.NonEmptyString,
    aspspName: Schema.NonEmptyString,
    aspspCountry: Schema.NonEmptyString,
    validUntil: Schema.NonEmptyString
});

export type EnableBankingTokenInterface = typeof EnableBankingTokenSchema.Type;
