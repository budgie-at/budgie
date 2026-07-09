import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';
import { DebtSectionInterface } from '../interface/debt-section.interface';
import { HomeSectionInterface } from '../interface/home-section.interface';

export const isDebtSection = (section: HomeSectionInterface): section is DebtSectionInterface =>
    section.kind === HomeSectionKindEnum.DEBT_YOU_OWE || section.kind === HomeSectionKindEnum.DEBT_OWED_TO_YOU;
