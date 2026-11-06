import { AccountTypeEnum, AccountWithSyncEntityInterface } from '@budgie/contracts';

import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';

export interface CashSectionInterface {
    readonly kind: HomeSectionKindEnum.CASH;
    readonly type: AccountTypeEnum.CASH;
    readonly total: number;
    readonly data: AccountWithSyncEntityInterface[];
}
