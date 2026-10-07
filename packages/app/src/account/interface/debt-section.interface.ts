import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';

import { DebtAccountItemInterface } from './debt-account-item.interface';

export interface DebtSectionInterface {
    readonly kind: HomeSectionKindEnum.DEBT_YOU_OWE | HomeSectionKindEnum.DEBT_OWED_TO_YOU;
    readonly data: DebtAccountItemInterface[];
}
