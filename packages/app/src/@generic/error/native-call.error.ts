import * as Schema from 'effect/Schema';

import { getErrorMessage } from '@rnw-community/shared';

export class NativeCallError extends Schema.TaggedError<NativeCallError, { readonly brand: unique symbol }>()('NativeCallError', {
    cause: Schema.Defect()
}) {
    override get message(): string {
        return getErrorMessage(this.cause);
    }
}
