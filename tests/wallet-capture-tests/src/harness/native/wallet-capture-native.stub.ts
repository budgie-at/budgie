import { WalletCaptureNativeRecordSchema } from '@app/wallet-capture/constant/wallet-capture-native-record-schema.constant';
import { WalletCaptureStatusEnum } from '@app/wallet-capture/enum/wallet-capture-status.enum';

import type { WalletCaptureAccountInterface } from '@app/wallet-capture/interface/wallet-capture-account.interface';

export class WalletCaptureNativeStub {
    private accounts: WalletCaptureAccountInterface[] = [];
    private records: unknown[] = [];

    async replaceAccounts(accounts: WalletCaptureAccountInterface[]): Promise<void> {
        this.accounts = [...accounts];
    }

    async getCaptures(): Promise<unknown> {
        return [...this.records];
    }

    async markNeedsReview(captureId: string, duplicateTransactionId: number): Promise<void> {
        this.records = this.records.map(record => {
            const result = WalletCaptureNativeRecordSchema.safeParse(record);

            if (result.success && result.data.captureId === captureId) {
                return { ...result.data, status: WalletCaptureStatusEnum.NEEDS_REVIEW, duplicateTransactionId };
            }

            return record;
        });
    }

    async acknowledgeCaptures(captureIds: string[]): Promise<void> {
        const acknowledgedIds = new Set(captureIds);

        this.records = this.records.filter(record => {
            const result = WalletCaptureNativeRecordSchema.safeParse(record);

            return !result.success || !acknowledgedIds.has(result.data.captureId);
        });
    }

    seed(records: unknown[]): void {
        this.records = [...records];
    }

    getAccounts(): WalletCaptureAccountInterface[] {
        return [...this.accounts];
    }

    reset(): void {
        this.accounts = [];
        this.records = [];
    }
}

export const walletCaptureNativeStub = new WalletCaptureNativeStub();
