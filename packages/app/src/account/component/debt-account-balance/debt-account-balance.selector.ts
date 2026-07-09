const normalizePart = (value: string) => value.replace(/[^a-zA-Z0-9]+/gu, '_');

const normalizeAmount = (value: string) => normalizePart(value);

export const DebtAccountBalanceSelector = {
    OutstandingAmount: (amount: number) => `DebtAccountBalance.OutstandingAmount.${normalizeAmount(String(amount))}` as const,
    PaidAmount: (amount: number) => `DebtAccountBalance.PaidAmount.${normalizeAmount(String(amount))}` as const,
    Percentage: (percentage: number) => `DebtAccountBalance.Percentage.${normalizeAmount(String(percentage))}` as const,
    TotalAmount: (amount: number) => `DebtAccountBalance.TotalAmount.${normalizeAmount(String(amount))}` as const
} as const;
