import * as Schema from 'effect/Schema';

export class SyncSchemaVersionUnsupportedError extends Schema.TaggedError<SyncSchemaVersionUnsupportedError>()(
    'SyncSchemaVersionUnsupportedError',
    {
        recordType: Schema.String,
        recordName: Schema.String,
        schemaVersion: Schema.Number,
        supportedVersion: Schema.Number
    }
) {
    override get message(): string {
        return `Sync record ${this.recordType}/${this.recordName} has schema version ${this.schemaVersion}, this app supports up to ${this.supportedVersion}`;
    }
}
