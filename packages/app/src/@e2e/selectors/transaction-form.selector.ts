const normalizePart = (value: string) => value.replace(/[^a-zA-Z0-9]+/gu, '_');

/* eslint-disable lingui/no-unlocalized-strings */
export const TransactionFormSelectors = {
    Page: 'TransactionForm.Page',
    DatePicker: 'TransactionForm.DatePicker',
    AmountInput: 'TransactionForm.AmountInput',
    CategorySelector: 'TransactionForm.CategorySelector',
    CategorySelectorTitle: 'TransactionForm.CategorySelector.Title',
    TagsSelector: 'TransactionForm.TagsSelector',
    Account: 'TransactionForm.Account',
    TagsSelectorTitle: 'TransactionForm.TagsSelector.Title',
    AccountSelector: 'TransactionForm.AccountSelector',
    SelectedAccount: (title: string) => `TransactionForm.SelectedAccount.${normalizePart(title)}` as const,
    AccountSearchInput: 'TransactionForm.AccountSearchInput',
    CommentInput: 'TransactionForm.CommentInput',
    SubmitButton: 'TransactionForm.SubmitButton'
} as const;
