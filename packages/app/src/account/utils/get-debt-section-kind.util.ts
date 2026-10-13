import { isBorrowLikeDebtType } from '@budgie/contracts';

import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';

import type { DebtSectionInterface } from '../interface/debt-section.interface';
import type { AccountDebtTypeEnum } from '@budgie/contracts';

export const getDebtSectionKind = (debtType: AccountDebtTypeEnum): DebtSectionInterface['kind'] =>
    isBorrowLikeDebtType(debtType) ? HomeSectionKindEnum.DEBT_YOU_OWE : HomeSectionKindEnum.DEBT_OWED_TO_YOU;
