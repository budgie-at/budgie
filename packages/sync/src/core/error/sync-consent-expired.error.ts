import * as Schema from 'effect/Schema';

import { SyncProviderEnum } from '../enum/sync-provider.enum';

export class SyncConsentExpiredError extends Schema.TaggedError<SyncConsentExpiredError, { readonly brand: unique symbol }>()(
    'SyncConsentExpiredError',
    {
        provider: Schema.Enum(SyncProviderEnum),
        message: Schema.String
    }
) {}
