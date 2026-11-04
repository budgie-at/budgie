import * as Schema from 'effect/Schema';

export class InzhurStatementInvalidError extends Schema.TaggedError<InzhurStatementInvalidError>()('InzhurStatementInvalidError', {
    reason: Schema.String
}) {}
