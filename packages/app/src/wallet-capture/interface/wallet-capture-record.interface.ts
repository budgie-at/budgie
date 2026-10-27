import type { WalletCaptureNativeRecordInterface } from './wallet-capture-native-record.interface';

export interface WalletCaptureRecordInterface extends Omit<WalletCaptureNativeRecordInterface, 'accountId'> {
    readonly accountId: number;
}
