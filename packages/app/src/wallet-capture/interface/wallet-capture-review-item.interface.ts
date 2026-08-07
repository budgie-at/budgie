import type { WalletCaptureReviewReasonEnum } from '../enum/wallet-capture-review-reason.enum';
import type { WalletCaptureNativeRecordInterface } from './wallet-capture-native-record.interface';

export interface WalletCaptureReviewItemInterface {
    readonly capture: WalletCaptureNativeRecordInterface;
    readonly duplicateTransactionId: number | null;
    readonly reason: WalletCaptureReviewReasonEnum;
}
