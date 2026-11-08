import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';
import { AccountTypeSectionInterface } from '../interface/account-type-section.interface';
import { HomeSectionInterface } from '../interface/home-section.interface';

export const isAccountTypeSection = (section: HomeSectionInterface): section is AccountTypeSectionInterface =>
    section.kind === HomeSectionKindEnum.ACCOUNT_TYPE;
