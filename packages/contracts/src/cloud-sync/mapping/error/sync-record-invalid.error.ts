import * as Schema from 'effect/Schema';

export class SyncRecordInvalidError extends Schema.TaggedError<SyncRecordInvalidError>()('SyncRecordInvalidError', {
    recordType: Schema.String,
    recordName: Schema.String,
    reason: Schema.String
}) {
    override get message(): string {
        return `Invalid sync record ${this.recordType}/${this.recordName}: ${this.reason}`;
    }
}
