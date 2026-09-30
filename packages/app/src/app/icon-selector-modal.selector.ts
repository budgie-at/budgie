import { UserIconType } from '@budgie/contracts';

export const IconSelectorModalSelector = {
    SearchInput: 'IconSelector.SearchInput',
    Suggestions: 'IconSelector.Suggestions',
    IconCard: (icon: UserIconType) => `IconSelector.Icon.${icon}` as const
} as const;
