const normalizePart = (value: string) => value.replace(/[^a-zA-Z0-9]+/gu, '_');

const normalizeAmount = (value: string) => normalizePart(value);

export const DebtAccountCardSummarySelector = {
    OutstandingAmount: (title: string, amount: number) =>
        `DebtAccountCardSummary.OutstandingAmount.${normalizePart(title)}.${normalizeAmount(String(amount))}` as const,
    PaidAmount: (title: string, amount: number) =>
        `DebtAccountCardSummary.PaidAmount.${normalizePart(title)}.${normalizeAmount(String(amount))}` as const,
    TotalAmount: (title: string, amount: number) =>
        `DebtAccountCardSummary.TotalAmount.${normalizePart(title)}.${normalizeAmount(String(amount))}` as const
} as const;
