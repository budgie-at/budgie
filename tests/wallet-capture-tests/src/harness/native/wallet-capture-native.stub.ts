import { WalletCaptureStatusEnum } from '@app/wallet-capture/enum/wallet-capture-status.enum';

import type { WalletCaptureAccountInterface } from '@app/wallet-capture/interface/wallet-capture-account.interface';
import type { WalletCaptureNativeRecordInterface } from '@app/wallet-capture/interface/wallet-capture-native-record.interface';

export class WalletCaptureNativeStub {
    private accounts: WalletCaptureAccountInterface[] = [];
    private records: WalletCaptureNativeRecordInterface[] = [];

    async replaceAccounts(accounts: WalletCaptureAccountInterface[]): Promise<void> {
        this.accounts = [...accounts];
    }

    async getCaptures(): Promise<WalletCaptureNativeRecordInterface[]> {
        return [...this.records];
    }

    async markNeedsReview(captureId: string, duplicateTransactionId: number): Promise<void> {
        this.records = this.records.map(record =>
            record.captureId === captureId ? { ...record, status: WalletCaptureStatusEnum.NEEDS_REVIEW, duplicateTransactionId } : record
        );
    }

    async acknowledgeCaptures(captureIds: string[]): Promise<void> {
        const acknowledgedIds = new Set(captureIds);

        this.records = this.records.filter(record => !acknowledgedIds.has(record.captureId));
    }

    seed(records: WalletCaptureNativeRecordInterface[]): void {
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
