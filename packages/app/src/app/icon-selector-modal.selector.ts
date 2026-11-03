import { UserIconType } from '@budgie/contracts';

export const IconSelectorModalSelector = {
    SearchInput: 'IconSelector.SearchInput',
    IconCard: (icon: UserIconType) => `IconSelector.Icon.${icon}` as const
} as const;
