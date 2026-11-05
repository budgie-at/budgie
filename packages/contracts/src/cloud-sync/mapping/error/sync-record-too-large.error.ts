import * as Schema from 'effect/Schema';

export class SyncRecordTooLargeError extends Schema.TaggedError<SyncRecordTooLargeError>()('SyncRecordTooLargeError', {
    recordName: Schema.String,
    bytes: Schema.Number,
    maxBytes: Schema.Number
}) {
    override get message(): string {
        return `Sync record ${this.recordName} is ${this.bytes} bytes, above the ${this.maxBytes} byte limit`;
    }
}
