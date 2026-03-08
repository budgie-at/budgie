import { UserIconNameEnum } from '@budgie/contracts';

 
export const CategoryCardSelectors = {
    Card: (title: string) => `CategoryCard.${title.trim()}` as const,
    Icon: (title: string, icon: UserIconNameEnum) => `CategoryCard.Icon.${title.trim()}.${icon}` as const
} as const;
