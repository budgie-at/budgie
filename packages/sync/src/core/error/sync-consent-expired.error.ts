import * as Schema from 'effect/Schema';

import { SyncProviderEnum } from '../enum/sync-provider.enum';

export class SyncConsentExpiredError extends Schema.TaggedError<SyncConsentExpiredError>()('SyncConsentExpiredError', {
    provider: Schema.Enum(SyncProviderEnum),
    message: Schema.String
}) {}
