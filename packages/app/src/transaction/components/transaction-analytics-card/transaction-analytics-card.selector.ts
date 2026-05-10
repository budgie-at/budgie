const normalizePart = (value: number | string) => String(value).replace(/[^a-zA-Z0-9]+/gu, '_');

export const TransactionAnalyticsCardSelector = {
    Amount: (label: string, amount: number) => `TransactionAnalyticsCard.Amount.${normalizePart(label)}.${normalizePart(amount)}` as const
} as const;
