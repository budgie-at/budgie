export const TransferQuickFormSelector = {
    FromAccount: 'TransferForm.FromAccount',
    ToAccount: 'TransferForm.ToAccount',
    SelectedFromAccount: (title: string) => `TransferForm.SelectedFromAccount.${title.trim()}` as const,
    SelectedToAccount: (title: string) => `TransferForm.SelectedToAccount.${title.trim()}` as const,
    SwapAccounts: 'TransferForm.SwapAccounts',
    ConversionRow: 'TransferForm.ConversionRow'
} as const;
