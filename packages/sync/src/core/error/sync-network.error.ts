import * as Schema from 'effect/Schema';

import { SyncProviderEnum } from '../enum/sync-provider.enum';

export class SyncNetworkError extends Schema.TaggedError<SyncNetworkError>()('SyncNetworkError', {
    provider: Schema.Enum(SyncProviderEnum),
    message: Schema.String
}) {}
