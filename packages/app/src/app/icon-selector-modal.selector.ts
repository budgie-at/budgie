import { UserIconNameEnum } from '@budgie/contracts';

export const IconSelectorModalSelector = {
    SearchInput: 'IconSelector.SearchInput',
    IconCard: (icon: UserIconNameEnum) => `IconSelector.Icon.${icon}` as const
} as const;
