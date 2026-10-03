import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';

import { DebtAccountGroupInterface } from './debt-account-group.interface';

export interface DebtSectionInterface {
    readonly kind: HomeSectionKindEnum.DEBT_YOU_OWE | HomeSectionKindEnum.DEBT_OWED_TO_YOU;
    readonly data: DebtAccountGroupInterface[];
}
