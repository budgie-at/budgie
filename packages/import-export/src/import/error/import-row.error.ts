import * as Schema from 'effect/Schema';

export class ImportRowError extends Schema.TaggedError<ImportRowError>()('ImportRowError', {
    reason: Schema.String,
    rowColumns: Schema.String
}) {
    override get message(): string {
        return this.reason;
    }
}
