import * as Schema from 'effect/Schema';

export const EnableBankingApplicationApiSchema = Schema.Struct({
    name: Schema.String,
    active: Schema.Boolean,
    environment: Schema.String,
    redirect_urls: Schema.Array(Schema.String)
});
