export const TransactionInfoPageSelector = {
    Page: 'TransactionInfo.Page',
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
        FromAccount: 'TransactionInfo.Row.FromAccount',
        MerchantCode: 'TransactionInfo.Row.MerchantCode',
        Note: 'TransactionInfo.Row.Note',
        Tags: 'TransactionInfo.Row.Tags',
        ToAccount: 'TransactionInfo.Row.ToAccount'
    }
} as const;
