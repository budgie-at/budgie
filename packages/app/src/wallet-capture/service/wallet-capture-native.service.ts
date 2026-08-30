import { Log } from '@budgie/logger';

import { getErrorMessage } from '@rnw-community/shared';

import { appleWalletCaptureNativeModule } from '../../../modules/apple-wallet-capture/src/apple-wallet-capture';
import { WalletCaptureNativeRecordsSchema } from '../constant/wallet-capture-native-record-schema.constant';

import type { WalletCaptureAccountInterface } from '../interface/wallet-capture-account.interface';
import type { WalletCaptureNativeRecordInterface } from '../interface/wallet-capture-native-record.interface';

class WalletCaptureNativeService {
    @Log(
        accounts => `enter accountIds=${accounts.map(account => account.id).join(',')}`,
        (_result, accounts) => `done accountIds=${accounts.map(account => account.id).join(',')}`,
        (error, accounts) => `throw accountIds=${accounts.map(account => account.id).join(',')} error=${getErrorMessage(error)}`
    )
    async replaceAccounts(accounts: WalletCaptureAccountInterface[]): Promise<void> {
        await appleWalletCaptureNativeModule.replaceAccounts(accounts);
    }

    @Log(
        'enter',
        result => `done captureIds=${result.map(record => record.captureId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async getCaptures(): Promise<WalletCaptureNativeRecordInterface[]> {
        return WalletCaptureNativeRecordsSchema.parse(await appleWalletCaptureNativeModule.getCaptures());
    }

    @Log(
        (captureId, duplicateTransactionId) => `enter captureId="${captureId}" duplicateTransactionId=${duplicateTransactionId}`,
        (_result, captureId, duplicateTransactionId) => `done captureId="${captureId}" duplicateTransactionId=${duplicateTransactionId}`,
        (error, captureId, duplicateTransactionId) =>
            `throw captureId="${captureId}" duplicateTransactionId=${duplicateTransactionId} error=${getErrorMessage(error)}`
    )
    async markNeedsReview(captureId: string, duplicateTransactionId: number): Promise<void> {
        await appleWalletCaptureNativeModule.markNeedsReview(captureId, duplicateTransactionId);
    }

    @Log(
        captureIds => `enter captureIds=${captureIds.join(',')}`,
        (_result, captureIds) => `done captureIds=${captureIds.join(',')}`,
        (error, captureIds) => `throw captureIds=${captureIds.join(',')} error=${getErrorMessage(error)}`
    )
    async acknowledgeCaptures(captureIds: string[]): Promise<void> {
        await appleWalletCaptureNativeModule.acknowledgeCaptures(captureIds);
    }
}

export const walletCaptureNativeService = new WalletCaptureNativeService();
