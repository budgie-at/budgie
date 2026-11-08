import { AccountWithSyncEntityInterface } from '@budgie/contracts';

import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';

export interface FamilySectionInterface {
    readonly kind: HomeSectionKindEnum.FAMILY;
    readonly data: AccountWithSyncEntityInterface[];
    readonly total: number;
}
