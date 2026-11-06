import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';
import { CashSectionInterface } from '../interface/cash-section.interface';
import { HomeSectionInterface } from '../interface/home-section.interface';

export const isCashSection = (section: HomeSectionInterface): section is CashSectionInterface => section.kind === HomeSectionKindEnum.CASH;
