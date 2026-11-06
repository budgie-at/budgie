import * as Schema from 'effect/Schema';

import { getErrorMessage } from '@rnw-community/shared';

export class AiModelDownloadError extends Schema.TaggedError<AiModelDownloadError, { readonly brand: unique symbol }>()(
    'AiModelDownloadError',
    { cause: Schema.Defect() }
) {
    override get message(): string {
        return getErrorMessage(this.cause);
    }
}
