export const TagCardSelector = {
    Card: (title: string) => `TagCard.${title.trim()}` as const
} as const;
