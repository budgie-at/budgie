 
export const TagCardSelectors = {
    Card: (title: string) => `TagCard.${title.trim()}` as const
} as const;
