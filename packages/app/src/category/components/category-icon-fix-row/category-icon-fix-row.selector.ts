export const CategoryIconFixRowSelector = {
    Row: (title: string) => `CategoryIconFixRow.${title.trim()}` as const,
    Suggestions: (title: string) => `CategoryIconFixRow.Suggestions.${title.trim()}` as const
} as const;
