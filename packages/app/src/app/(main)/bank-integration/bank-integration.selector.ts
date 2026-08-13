export const BankIntegrationSelector = {
    Page: 'BankIntegration.Page',
    AddAccountsButton: 'BankIntegration.AddAccountsButton',
    ImportFileButton: 'BankIntegration.ImportFileButton',
    AddDepositButton: 'BankIntegration.AddDepositButton',
    AccountRow: (id: number) => `BankIntegration.AccountRow.${id}` as const
} as const;
