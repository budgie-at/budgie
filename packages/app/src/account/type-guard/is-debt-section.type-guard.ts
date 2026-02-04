import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';
import { DebtSectionInterface, HomeSectionInterface } from '../utils/build-home-page-sections.util';

export const isDebtSection = (section: HomeSectionInterface): section is DebtSectionInterface =>
    section.kind === HomeSectionKindEnum.DEBT_YOU_OWE || section.kind === HomeSectionKindEnum.DEBT_OWED_TO_YOU;
