/* eslint-disable lingui/no-unlocalized-strings */
const normalizePart = (value: number | string) => String(value).replace(/[^a-zA-Z0-9]+/g, '_');

export const TransactionCardSelectors = {
    Card: (id: number) => `TransactionCard.${id}` as const,
    LabelCard: (value: string) => `TransactionCard.Label.${normalizePart(value)}` as const,
    Amount: (id: number) => `TransactionCard.Amount.${id}` as const,
    AdjustmentCard: (id: number) => `TransactionCard.Adjustment.${id}` as const,
    AdjustmentBadge: 'TransactionCard.Badge.Adjustment',
    AdjustmentAmount: (amount: number | string) => `TransactionCard.AdjustmentAmount.${normalizePart(amount)}` as const
} as const;
