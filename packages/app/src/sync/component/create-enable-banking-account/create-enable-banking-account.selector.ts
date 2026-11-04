export const CreateEnableBankingAccountSelector = {
    ScrollView: 'CreateEnableBankingAccount.ScrollView',
    ApplicationIdInput: 'CreateEnableBankingAccount.ApplicationIdInput',
    PickKeyButton: 'CreateEnableBankingAccount.PickKeyButton',
    ContinueButton: 'CreateEnableBankingAccount.ContinueButton',
    BankSearchInput: 'CreateEnableBankingAccount.BankSearchInput',
    BankRow: (name: string) => `CreateEnableBankingAccount.BankRow.${name}` as const,
    ChooseAnotherBankButton: 'CreateEnableBankingAccount.ChooseAnotherBankButton',
    StartSyncButton: 'CreateEnableBankingAccount.StartSyncButton'
} as const;
