/* eslint-disable lingui/no-unlocalized-strings */
import { UserIconNameEnum } from '@budgie/contracts';

export const IconSelectorSelectors = {
    SearchInput: 'IconSelector.SearchInput',
    IconCard: (icon: UserIconNameEnum) => `IconSelector.Icon.${icon}` as const
} as const;
