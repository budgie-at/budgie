export const SplitEntryRowSelector = {
    Category: (index: number) => `SplitEntryRow.Category.${index}` as const,
    Amount: (index: number) => `SplitEntryRow.Amount.${index}` as const,
    Delete: (index: number) => `SplitEntryRow.Delete.${index}` as const
} as const;
