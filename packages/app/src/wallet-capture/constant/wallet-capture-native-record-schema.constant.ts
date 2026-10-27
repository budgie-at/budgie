import * as Schema from 'effect/Schema';

export const WalletCaptureNativeRecordSchema = Schema.Struct({
    captureId: Schema.String.check(Schema.isUUID()),
    accountId: Schema.NullOr(Schema.Number.check(Schema.isInt(), Schema.isGreaterThan(0))),
    amount: Schema.Number.check(Schema.isFinite(), Schema.isGreaterThan(0)),
    currency: Schema.NullOr(Schema.String),
    merchant: Schema.String,
    cardName: Schema.NullOr(Schema.String),
    capturedAt: Schema.String
});

export const WalletCaptureNativeRecordsSchema = Schema.Array(WalletCaptureNativeRecordSchema);
