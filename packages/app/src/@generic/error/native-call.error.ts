import * as Schema from 'effect/Schema';

import { getErrorMessage } from '@rnw-community/shared';

export class NativeCallError extends Schema.TaggedError<NativeCallError>()('NativeCallError', { cause: Schema.Defect() }) {
    override get message(): string {
        return getErrorMessage(this.cause);
    }
}
