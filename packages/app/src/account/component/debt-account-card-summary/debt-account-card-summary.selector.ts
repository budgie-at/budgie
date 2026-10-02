const normalizePart = (value: string) => value.replace(/[^a-zA-Z0-9]+/gu, '_');

export const DebtAccountCardSummarySelector = {
    OutstandingAmount: (title: string, amount: number) =>
        `DebtAccountCardSummary.OutstandingAmount.${normalizePart(title)}.${normalizePart(String(amount))}` as const,
    TotalAmount: (title: string, amount: number) =>
        `DebtAccountCardSummary.TotalAmount.${normalizePart(title)}.${normalizePart(String(amount))}` as const
} as const;
