export const MakeRecurringSheetSelector = {
    Page: 'MakeRecurring.Page',
    FittingRow: (title: string) => `MakeRecurring.FittingRow.${title.replaceAll(/[^a-zA-Z0-9]+/gu, '_')}` as const,
    CreateRow: 'MakeRecurring.CreateRow'
} as const;
