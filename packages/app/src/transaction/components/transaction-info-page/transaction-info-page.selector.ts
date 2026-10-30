export const TransactionInfoPageSelector = {
    Amount: 'TransactionInfo.Amount',
    Page: 'TransactionInfo.Page',
    DeleteButton: 'TransactionActionsMenu.DeleteButton',
    EditButton: 'TransactionInfo.EditButton',
    SimilarCard: 'TransactionInfo.SimilarCard',
    SimilarTotal: 'TransactionInfo.SimilarTotal',
    SimilarAverage: 'TransactionInfo.SimilarAverage',
    RefundedPill: 'TransactionInfo.RefundedPill',
    SimilarBar: (index: number) => `TransactionInfo.SimilarBar.${index}` as const,
    Row: {
        Account: 'TransactionInfo.Row.Account',
        Category: 'TransactionInfo.Row.Category',
        Consolidation: 'TransactionInfo.Row.Consolidation',
        Date: 'TransactionInfo.Row.Date',
        ExchangeRate: 'TransactionInfo.Row.ExchangeRate',
        Fee: 'TransactionInfo.Row.Fee',
        Debt: 'TransactionInfo.Row.Debt',
        FromAccount: 'TransactionInfo.Row.FromAccount',
        MerchantCode: 'TransactionInfo.Row.MerchantCode',
        Note: 'TransactionInfo.Row.Note',
        Receipt: 'TransactionInfo.Row.Receipt',
        SplitEntry: (index: number) => `TransactionInfo.Row.SplitEntry.${index}` as const,
        Tags: 'TransactionInfo.Row.Tags',
        ToAccount: 'TransactionInfo.Row.ToAccount'
    }
} as const;
