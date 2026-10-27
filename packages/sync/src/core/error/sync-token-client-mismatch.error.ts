import * as Schema from 'effect/Schema';

import { SyncProviderEnum } from '../enum/sync-provider.enum';

export class SyncTokenClientMismatchError extends Schema.TaggedError<SyncTokenClientMismatchError>()('SyncTokenClientMismatchError', {
    provider: Schema.Enum(SyncProviderEnum),
    integrationId: Schema.Number,
    message: Schema.String
}) {}
