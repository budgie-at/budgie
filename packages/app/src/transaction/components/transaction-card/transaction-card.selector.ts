const normalizePart = (value: number | string) => String(value).replaceAll(/[^a-zA-Z0-9]+/gu, '_');

export const TransactionCardSelector = {
    Card: (id: number) => `TransactionCard.${id}` as const,
    LabelCard: (value: string) => `TransactionCard.Label.${normalizePart(value)}` as const,
    Amount: (id: number) => `TransactionCard.Amount.${id}` as const,
    Category: (value: string) => `TransactionCard.Category.${normalizePart(value)}` as const,
    RefundedPill: (id: number) => `TransactionCard.RefundedPill.${id}` as const,
    AdjustmentCard: (id: number) => `TransactionCard.Adjustment.${id}` as const,
    AdjustmentBadge: 'TransactionCard.Badge.Adjustment',
    UncategorizedBadge: 'TransactionCard.Badge.Uncategorized',
    AdjustmentAmount: (amount: number | string) => `TransactionCard.AdjustmentAmount.${normalizePart(amount)}` as const
} as const;
