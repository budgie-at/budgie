import * as Schema from 'effect/Schema';

import { ICloudErrorCode } from '../../../modules/icloud';

export class CloudSyncTransportError extends Schema.TaggedError<CloudSyncTransportError, { readonly brand: unique symbol }>()(
    'CloudSyncTransportError',
    {
        code: Schema.Enum(ICloudErrorCode),
        message: Schema.String
    }
) {}
