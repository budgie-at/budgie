import * as Schema from 'effect/Schema';

import { WalletCaptureStatusEnum } from '../enum/wallet-capture-status.enum';

export const WalletCaptureNativeRecordSchema = Schema.Struct({
    captureId: Schema.String.check(Schema.isUUID()),
    accountId: Schema.Number.check(Schema.isInt(), Schema.isGreaterThan(0)),
    amount: Schema.Number.check(Schema.isFinite(), Schema.isGreaterThan(0)),
    merchant: Schema.String,
    cardName: Schema.NullOr(Schema.String),
    capturedAt: Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u)),
    status: Schema.Enum(WalletCaptureStatusEnum),
    duplicateTransactionId: Schema.NullOr(Schema.Number.check(Schema.isInt(), Schema.isGreaterThan(0)))
});

export const WalletCaptureNativeRecordsSchema = Schema.Array(WalletCaptureNativeRecordSchema);
