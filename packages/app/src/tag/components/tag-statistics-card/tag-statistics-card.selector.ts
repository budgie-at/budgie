const normalizePart = (value: number | string) => String(value).replaceAll(/[^a-zA-Z0-9]+/gu, '_');

export const TagStatisticsCardSelector = {
    Card: (title: string) => `TagStatisticsCard.${normalizePart(title)}` as const,
    Untagged: 'TagStatisticsCard.Untagged',
    Amount: (title: string, amount: number) => `TagStatisticsCard.Amount.${normalizePart(title)}.${normalizePart(amount)}` as const
} as const;
