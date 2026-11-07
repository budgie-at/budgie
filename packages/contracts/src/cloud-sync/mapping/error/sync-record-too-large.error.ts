import * as Schema from 'effect/Schema';

export class SyncRecordTooLargeError extends Schema.TaggedError<SyncRecordTooLargeError, { readonly brand: unique symbol }>()(
    'SyncRecordTooLargeError',
    {
        recordName: Schema.String,
        bytes: Schema.Finite,
        maxBytes: Schema.Finite
    }
) {
    override get message(): string {
        return `Sync record ${this.recordName} is ${this.bytes} bytes, above the ${this.maxBytes} byte limit`;
    }
}
