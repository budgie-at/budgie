import type { BankSyncStatusEnum } from '@budgie/contracts';

export interface BuildBankSyncStatusLabelInputInterface {
    readonly status: BankSyncStatusEnum;
    readonly isForwardMode: boolean;
    readonly isSyncing: boolean;
}
