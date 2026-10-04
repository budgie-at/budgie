const normalizePart = (value: number | string) => String(value).replaceAll(/[^a-zA-Z0-9]+/gu, '_');

export const CategoryStatisticsCardSelector = {
    Card: (title: string) => `CategoryStatisticsCard.${normalizePart(title)}` as const,
    Uncategorized: 'CategoryStatisticsCard.Uncategorized',
    Amount: (title: string, amount: number) => `CategoryStatisticsCard.Amount.${normalizePart(title)}.${normalizePart(amount)}` as const
} as const;
