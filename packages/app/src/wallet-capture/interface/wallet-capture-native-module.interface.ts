import type { WalletCaptureAccountInterface } from './wallet-capture-account.interface';

export interface WalletCaptureNativeModuleInterface {
    readonly replaceAccounts: (accounts: WalletCaptureAccountInterface[]) => Promise<void>;
    readonly getCaptures: () => Promise<unknown>;
    readonly markNeedsReview: (captureId: string, duplicateTransactionId: number) => Promise<void>;
    readonly acknowledgeCaptures: (captureIds: string[]) => Promise<void>;
}
