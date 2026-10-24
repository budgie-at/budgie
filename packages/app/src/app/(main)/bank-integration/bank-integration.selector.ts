export const BankIntegrationSelector = {
    Page: 'BankIntegration.Page',
    Overview: 'BankIntegration.Overview',
    StatusPill: 'BankIntegration.StatusPill',
    NameCard: 'BankIntegration.NameCard',
    KeyCard: 'BankIntegration.KeyCard',
    NewAccountsStatus: 'BankIntegration.NewAccountsStatus',
    UpdateKeyButton: 'BankIntegration.UpdateKeyButton',
    RetryNewAccountsButton: 'BankIntegration.RetryNewAccountsButton',
    NewAccountRow: (externalId: string) => `BankIntegration.NewAccountRow.${externalId}` as const,
    ImportFileButton: 'BankIntegration.ImportFileButton',
    AddDepositButton: 'BankIntegration.AddDepositButton',
    EmptyState: 'BankIntegration.EmptyState',
    ErrorState: 'BankIntegration.ErrorState',
    AccountRow: (id: number) => `BankIntegration.AccountRow.${id}` as const
} as const;
