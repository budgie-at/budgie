import { AccountTypeSectionInterface } from './account-type-section.interface';
import { DebtSectionInterface } from './debt-section.interface';
import { FamilySectionInterface } from './family-section.interface';

export type HomeSectionInterface = AccountTypeSectionInterface | DebtSectionInterface | FamilySectionInterface;
