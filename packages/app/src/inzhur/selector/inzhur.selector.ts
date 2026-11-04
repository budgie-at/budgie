export const InzhurSelector = {
    CreatePage: 'Inzhur.CreatePage',
    AddButton: 'Inzhur.AddButton',
    ImportPage: 'Inzhur.ImportPage',
    SelectFileButton: 'Inzhur.SelectFileButton',
    DoneButton: 'Inzhur.DoneButton',
    Summary: 'Inzhur.Summary',
    SummaryFund: (isin: string) => `Inzhur.SummaryFund.${isin}` as const,
    PayoutOption: (payout: string) => `Inzhur.PayoutOption.${payout}` as const,
    FundReturns: 'Inzhur.FundReturns',
    StatementReminder: 'Inzhur.StatementReminder'
} as const;
