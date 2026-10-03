import type { SyncAccountTypeEnum } from '../enum/sync-account-type.enum';

export interface SyncAccountPreviewInterface {
    readonly externalId: string;
    readonly title: string;
    readonly type: SyncAccountTypeEnum;
    readonly currencyCode: string;
    readonly iban: string | null;
    readonly existingAccountId: number | null;
    readonly hasSync: boolean;
    readonly isParked: boolean;
}
