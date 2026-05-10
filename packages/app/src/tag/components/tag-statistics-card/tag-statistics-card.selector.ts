const normalizePart = (value: number | string) => String(value).replace(/[^a-zA-Z0-9]+/gu, '_');

export const TagStatisticsCardSelector = {
    Card: (title: string) => `TagStatisticsCard.${normalizePart(title)}` as const,
    Amount: (title: string, amount: number) => `TagStatisticsCard.Amount.${normalizePart(title)}.${normalizePart(amount)}` as const
} as const;
