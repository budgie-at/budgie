export const BankIntegrationSelector = {
    Page: 'BankIntegration.Page',
    AddAccountsButton: 'BankIntegration.AddAccountsButton',
    AddDepositButton: 'BankIntegration.AddDepositButton',
    AccountRow: (id: number) => `BankIntegration.AccountRow.${id}` as const
} as const;
