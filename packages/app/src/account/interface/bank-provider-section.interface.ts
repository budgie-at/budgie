import { BankSyncStatusEnum, ExternalSourceEnum } from '@budgie/contracts';

import { AccountRowInterface } from './account-row.interface';

interface BankProviderSectionInterface {
    readonly kind: 'bankProvider';
    readonly provider: ExternalSourceEnum;
    readonly data: AccountRowInterface[];
}

export interface BankProviderSectionWithStatusInterface extends BankProviderSectionInterface {
    readonly syncStatus: BankSyncStatusEnum;
}
