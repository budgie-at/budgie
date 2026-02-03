import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';
import { BankProviderSectionWithStatusInterface } from '../interface/bank-provider-section.interface';
import { HomeSectionInterface } from '../utils/build-home-page-sections.util';

export const isBankProviderSection = (section: HomeSectionInterface): section is BankProviderSectionWithStatusInterface =>
    section.kind === HomeSectionKindEnum.BANK_PROVIDER;
