export const CreateTransactionMenuSelector = {
    Trigger: 'ActionButton',
    Close: 'ActionButton.Close',
    Expense: 'ActionItem.Expense',
    Income: 'ActionItem.Income',
    Transfer: 'ActionItem.Transfer',
    AddAccount: 'ActionItem.AddAccount',
    item: (index: number) => `ActionItem.${index}` as const
} as const;
