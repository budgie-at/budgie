import { AccountWithSyncEntityInterface, ExternalSourceEnum } from '@budgie/contracts';

import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';

export interface BankProviderSectionInterface {
    readonly kind: HomeSectionKindEnum.BANK_PROVIDER;
    readonly provider: ExternalSourceEnum;
    readonly integrationId: number;
    readonly label: string | null;
    readonly groupNumber: number | null;
    readonly data: AccountWithSyncEntityInterface[];
}
