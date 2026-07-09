import { AccountTypeSectionInterface } from './account-type-section.interface';
import { BankProviderSectionInterface } from './bank-provider-section.interface';
import { DebtSectionInterface } from './debt-section.interface';

export type HomeSectionInterface = AccountTypeSectionInterface | BankProviderSectionInterface | DebtSectionInterface;
