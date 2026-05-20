const normalizePart = (value: string | number) => String(value).replace(/[^a-zA-Z0-9]+/gu, '_');

export const ConsolidationSourceModalSelector = {
    Row: (index: number) => `ConsolidationSourceModal.Row.${index}` as const,
    RowTitle: (index: number, title: string) => `ConsolidationSourceModal.RowTitle.${index}.${normalizePart(title)}` as const,
    RowAmount: (index: number, entryType: string, amount: number) =>
        `ConsolidationSourceModal.RowAmount.${index}.${normalizePart(entryType)}.${normalizePart(amount)}` as const,
    RowFromAccount: (index: number, title: string) => `ConsolidationSourceModal.RowFromAccount.${index}.${normalizePart(title)}` as const,
    RowToAccount: (index: number, title: string) => `ConsolidationSourceModal.RowToAccount.${index}.${normalizePart(title)}` as const,
    RevertButton: 'ConsolidationSourceModal.RevertButton',
    DoneButton: 'ConsolidationSourceModal.DoneButton'
} as const;
