export const TransactionInfoPageSelector = {
    Page: 'TransactionInfo.Page',
    EditButton: 'TransactionInfo.EditButton',
    SimilarCard: 'TransactionInfo.SimilarCard',
    SimilarTotal: 'TransactionInfo.SimilarTotal',
    SimilarAverage: 'TransactionInfo.SimilarAverage',
    RefundedPill: 'TransactionInfo.RefundedPill',
    ReceiptPill: 'TransactionInfo.ReceiptPill',
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
        Tags: 'TransactionInfo.Row.Tags',
        ToAccount: 'TransactionInfo.Row.ToAccount'
    }
} as const;
