const normalizePart = (value: string) => value.replaceAll(/[^a-zA-Z0-9]+/gu, '_');

export const SimpleQuickFormSelector = {
    Scroll: 'TransactionForm.Scroll',
    Page: 'TransactionForm.Page',
    DatePicker: 'TransactionForm.DatePicker',
    AmountInput: 'TransactionForm.AmountInput',
    MerchantInput: 'TransactionForm.MerchantInput',
    CategorySelector: 'TransactionForm.CategorySelector',
    CategorySelectorTitle: 'TransactionForm.CategorySelector.Title',
    TagsSelector: 'TransactionForm.TagsSelector',
    Account: 'TransactionForm.Account',
    TagsSelectorTitle: 'TransactionForm.TagsSelector.Title',
    AccountSelector: 'TransactionForm.AccountSelector',
    SelectedAccount: (title: string) => `TransactionForm.SelectedAccount.${normalizePart(title)}` as const,
    AccountSearchInput: 'TransactionForm.AccountSearchInput',
    CommentInput: 'TransactionForm.CommentInput',
    NoteInput: 'NoteInput.Input',
    NoteSubmitButton: 'NoteInput.SubmitButton',
    ValidationMessage: 'TransactionForm.ValidationMessage',
    Accessory: 'TransactionForm.Accessory',
    SecondaryLine: 'TransactionForm.SecondaryLine',
    SubmitButton: 'TransactionForm.SubmitButton'
} as const;
