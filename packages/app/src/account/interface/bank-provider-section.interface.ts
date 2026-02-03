import { BankSyncStatusEnum, ExternalSourceEnum } from '@budgie/contracts';

import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';

import { AccountRowInterface } from './account-row.interface';

interface BankProviderSectionInterface {
    readonly kind: HomeSectionKindEnum.BANK_PROVIDER;
    readonly provider: ExternalSourceEnum;
    readonly data: AccountRowInterface[];
}

export interface BankProviderSectionWithStatusInterface extends BankProviderSectionInterface {
    readonly syncStatus: BankSyncStatusEnum;
}
