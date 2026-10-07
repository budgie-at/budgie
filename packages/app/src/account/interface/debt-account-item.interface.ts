import { AccountWithSyncEntityInterface } from '@budgie/contracts';

import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';

export interface DebtAccountItemInterface {
    readonly kind: HomeSectionKindEnum.DEBT_YOU_OWE | HomeSectionKindEnum.DEBT_OWED_TO_YOU;
    readonly debtAccount: AccountWithSyncEntityInterface;
}
