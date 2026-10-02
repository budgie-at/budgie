import * as Schema from 'effect/Schema';

import { SyncProviderEnum } from '../enum/sync-provider.enum';

export class SyncInvalidResponseError extends Schema.TaggedError<SyncInvalidResponseError>()('SyncInvalidResponseError', {
    provider: Schema.Enum(SyncProviderEnum),
    message: Schema.String,
    apiCode: Schema.optional(Schema.Union([Schema.String, Schema.Number]))
}) {}
