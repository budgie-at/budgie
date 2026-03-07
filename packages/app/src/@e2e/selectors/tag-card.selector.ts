/* eslint-disable lingui/no-unlocalized-strings */
export const TagCardSelectors = {
    Card: (title: string) => `TagCard.${title.trim()}` as const
} as const;
