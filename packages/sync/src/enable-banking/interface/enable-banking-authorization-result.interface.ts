import type { SyncAccountPreviewInterface } from '../../core/interface/sync-account-preview.interface';
import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';

export interface EnableBankingAuthorizationResultInterface {
    readonly integrationId: number;
    readonly isReconsent: boolean;
    readonly accounts: SyncAccountInterface[];
    readonly previews: SyncAccountPreviewInterface[];
}
