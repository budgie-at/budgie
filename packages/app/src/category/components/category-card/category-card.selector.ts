import { UserIconType } from '@budgie/contracts';

export const CategoryCardSelector = {
    Card: (title: string) => `CategoryCard.${title.trim()}` as const,
    Icon: (title: string, icon: UserIconType) => `CategoryCard.Icon.${title.trim()}.${icon}` as const
} as const;
