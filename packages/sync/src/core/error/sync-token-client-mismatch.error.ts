import * as Schema from 'effect/Schema';

import { SyncProviderEnum } from '../enum/sync-provider.enum';

export class SyncTokenClientMismatchError extends Schema.TaggedError<SyncTokenClientMismatchError, { readonly brand: unique symbol }>()(
    'SyncTokenClientMismatchError',
    {
        provider: Schema.Enum(SyncProviderEnum),
        integrationId: Schema.Finite,
        message: Schema.String
    }
) {}
