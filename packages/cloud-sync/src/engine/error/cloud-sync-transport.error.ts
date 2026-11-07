import * as Schema from 'effect/Schema';

import { ICloudErrorCode } from '../../transport/enum/icloud-error-code.enum';

export class CloudSyncTransportError extends Schema.TaggedError<CloudSyncTransportError, { readonly brand: unique symbol }>()(
    'CloudSyncTransportError',
    {
        code: Schema.Enum(ICloudErrorCode),
        message: Schema.String
    }
) {}
