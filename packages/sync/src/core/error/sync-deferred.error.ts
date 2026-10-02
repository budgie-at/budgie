import * as Schema from 'effect/Schema';

import { SyncProviderEnum } from '../enum/sync-provider.enum';

export class SyncDeferredError extends Schema.TaggedError<SyncDeferredError>()('SyncDeferredError', {
    provider: Schema.Enum(SyncProviderEnum),
    message: Schema.String
}) {}
