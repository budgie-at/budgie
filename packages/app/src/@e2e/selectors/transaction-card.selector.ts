/* eslint-disable lingui/no-unlocalized-strings */
const normalizePart = (value: number | string) => String(value).replace(/[^a-zA-Z0-9]+/gu, '_');

export const TransactionCardSelectors = {
    Card: (id: number) => `TransactionCard.${id}` as const,
    LabelCard: (value: string) => `TransactionCard.Label.${normalizePart(value)}` as const,
    Amount: (id: number) => `TransactionCard.Amount.${id}` as const,
    Category: (value: string) => `TransactionCard.Category.${normalizePart(value)}` as const,
    Tag: (value: string) => `TransactionCard.Tag.${normalizePart(value)}` as const,
    Account: (value: string) => `TransactionCard.Account.${normalizePart(value)}` as const,
    FromAccount: (value: string) => `TransactionCard.FromAccount.${normalizePart(value)}` as const,
    ToAccount: (value: string) => `TransactionCard.ToAccount.${normalizePart(value)}` as const,
    AdjustmentCard: (id: number) => `TransactionCard.Adjustment.${id}` as const,
    AdjustmentBadge: 'TransactionCard.Badge.Adjustment',
    AdjustmentAmount: (amount: number | string) => `TransactionCard.AdjustmentAmount.${normalizePart(amount)}` as const
} as const;
