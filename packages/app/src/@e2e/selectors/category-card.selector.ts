import { UserIconNameEnum } from '@budgie/contracts';

/* eslint-disable lingui/no-unlocalized-strings */
export const CategoryCardSelectors = {
    Card: (title: string) => `CategoryCard.${title.trim()}` as const,
    Icon: (title: string, icon: UserIconNameEnum) => `CategoryCard.Icon.${title.trim()}.${icon}` as const
} as const;
