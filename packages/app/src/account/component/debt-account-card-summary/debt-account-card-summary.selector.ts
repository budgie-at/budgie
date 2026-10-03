const normalizePart = (value: string | number) => String(value).replace(/[^a-zA-Z0-9]+/gu, '_');

export const DebtAccountCardSummarySelector = {
    OutstandingAmount: (title: string, amount: number) =>
        `DebtAccountCardSummary.OutstandingAmount.${normalizePart(title)}.${normalizePart(amount)}` as const,
    TotalAmount: (title: string, amount: number) =>
        `DebtAccountCardSummary.TotalAmount.${normalizePart(title)}.${normalizePart(amount)}` as const,
    Percentage: (title: string, percentage: number) =>
        `DebtAccountCardRing.Percentage.${normalizePart(title)}.${normalizePart(percentage)}` as const
} as const;
