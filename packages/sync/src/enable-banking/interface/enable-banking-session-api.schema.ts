import * as Schema from 'effect/Schema';

import { EnableBankingAccountApiSchema } from './enable-banking-account-api.schema';

const AccessSchema = Schema.Struct({ valid_until: Schema.String });
const AspspSchema = Schema.Struct({ name: Schema.String, country: Schema.String });

export const EnableBankingStartAuthorizationApiSchema = Schema.Struct({ url: Schema.String });

export const EnableBankingAuthorizedSessionApiSchema = Schema.Struct({
    session_id: Schema.String,
    accounts: Schema.Array(EnableBankingAccountApiSchema),
    aspsp: AspspSchema,
    access: AccessSchema
});

export const EnableBankingSessionApiSchema = Schema.Struct({
    status: Schema.String,
    accounts_data: Schema.Array(Schema.Struct({ uid: Schema.String, identification_hash: Schema.String }))
});

export type EnableBankingSessionApiInterface = typeof EnableBankingSessionApiSchema.Type;
