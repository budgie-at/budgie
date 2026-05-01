export const CreateTransactionMenuSelector = {
    Trigger: 'ActionButton',
    Expense: 'ActionItem.Expense',
    Income: 'ActionItem.Income',
    Transfer: 'ActionItem.Transfer',
    AddAccount: 'ActionItem.AddAccount',
    item: (index: number) => `ActionItem.${index}` as const
} as const;
