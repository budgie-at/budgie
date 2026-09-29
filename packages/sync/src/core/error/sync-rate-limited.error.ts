import * as Schema from 'effect/Schema';

import { SyncProviderEnum } from '../enum/sync-provider.enum';

export class SyncRateLimitedError extends Schema.TaggedError<SyncRateLimitedError>()('SyncRateLimitedError', {
    provider: Schema.Enum(SyncProviderEnum),
    message: Schema.String
}) {}
