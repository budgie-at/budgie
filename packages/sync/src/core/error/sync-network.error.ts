import * as Schema from 'effect/Schema';

import { SyncProviderEnum } from '../enum/sync-provider.enum';

export class SyncNetworkError extends Schema.TaggedError<SyncNetworkError, { readonly brand: unique symbol }>()('SyncNetworkError', {
    provider: Schema.Enum(SyncProviderEnum),
    message: Schema.String
}) {}
