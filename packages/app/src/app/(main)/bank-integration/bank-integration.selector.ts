export const BankIntegrationSelector = {
    Page: 'BankIntegration.Page',
    NewAccountsStatus: 'BankIntegration.NewAccountsStatus',
    NewAccountRow: (externalId: string) => `BankIntegration.NewAccountRow.${externalId}` as const,
    ImportFileButton: 'BankIntegration.ImportFileButton',
    AddDepositButton: 'BankIntegration.AddDepositButton',
    EmptyState: 'BankIntegration.EmptyState',
    ErrorState: 'BankIntegration.ErrorState',
    AccountRow: (id: number) => `BankIntegration.AccountRow.${id}` as const
} as const;
