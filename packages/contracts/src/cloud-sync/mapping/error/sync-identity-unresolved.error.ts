import * as Schema from 'effect/Schema';

export class SyncIdentityUnresolvedError extends Schema.TaggedError<SyncIdentityUnresolvedError>()('SyncIdentityUnresolvedError', {
    tableName: Schema.String,
    column: Schema.String,
    localKey: Schema.String
}) {
    override get message(): string {
        return `No sync identity for ${this.tableName}.${this.column} (local key ${this.localKey})`;
    }
}
