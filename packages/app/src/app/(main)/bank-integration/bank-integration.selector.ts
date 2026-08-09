export const BankIntegrationSelector = {
    Page: 'BankIntegration.Page',
    AddDepositButton: 'BankIntegration.AddDepositButton',
    AccountRow: (id: number) => `BankIntegration.AccountRow.${id}` as const
} as const;
