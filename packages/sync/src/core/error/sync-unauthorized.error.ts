import * as Schema from 'effect/Schema';

import { SyncProviderEnum } from '../enum/sync-provider.enum';

export class SyncUnauthorizedError extends Schema.TaggedError<SyncUnauthorizedError>()('SyncUnauthorizedError', {
    provider: Schema.Enum(SyncProviderEnum),
    message: Schema.String
}) {}
