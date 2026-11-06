import * as Schema from 'effect/Schema';

import { getErrorMessage } from '@rnw-community/shared';

export class DbError extends Schema.TaggedError<DbError, { readonly brand: unique symbol }>()('DbError', { cause: Schema.Defect() }) {
    override get message(): string {
        return getErrorMessage(this.cause);
    }
}
