import { z } from 'zod';

import { WalletCaptureStatusEnum } from '../enum/wallet-capture-status.enum';

export const WalletCaptureNativeRecordSchema = z.object({
    captureId: z.uuid(),
    accountId: z.number().int().positive(),
    amount: z.number().positive().finite(),
    merchant: z.string(),
    cardName: z.string().nullable(),
    capturedAt: z.iso.datetime({ offset: true }),
    status: z.enum(WalletCaptureStatusEnum),
    duplicateTransactionId: z.number().int().positive().nullable()
});

export const WalletCaptureNativeRecordsSchema = z.array(WalletCaptureNativeRecordSchema);
