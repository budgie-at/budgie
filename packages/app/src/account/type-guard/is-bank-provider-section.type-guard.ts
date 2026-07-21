import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';
import { BankProviderSectionInterface } from '../interface/bank-provider-section.interface';
import { HomeSectionInterface } from '../interface/home-section.interface';

export const isBankProviderSection = (section: HomeSectionInterface): section is BankProviderSectionInterface =>
    section.kind === HomeSectionKindEnum.BANK_PROVIDER;
