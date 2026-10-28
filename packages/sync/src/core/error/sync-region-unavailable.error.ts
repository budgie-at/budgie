import * as Schema from 'effect/Schema';

import { SyncProviderEnum } from '../enum/sync-provider.enum';

export class SyncRegionUnavailableError extends Schema.TaggedError<SyncRegionUnavailableError>()('SyncRegionUnavailableError', {
    provider: Schema.Enum(SyncProviderEnum),
    message: Schema.String
}) {}
