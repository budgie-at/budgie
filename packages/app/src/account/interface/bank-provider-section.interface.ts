import { ExternalSourceEnum } from '@budgie/contracts';

import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';

import { AccountRowInterface } from './account-row.interface';

export interface BankProviderSectionInterface {
    readonly kind: HomeSectionKindEnum.BANK_PROVIDER;
    readonly provider: ExternalSourceEnum;
    readonly data: AccountRowInterface[];
}
