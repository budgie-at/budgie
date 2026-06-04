import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';
import { BankProviderSectionInterface } from '../interface/bank-provider-section.interface';
import { HomeSectionInterface } from '../utils/build-home-page-sections.util';

export const isBankProviderSection = (section: HomeSectionInterface): section is BankProviderSectionInterface =>
    section.kind === HomeSectionKindEnum.BANK_PROVIDER;
