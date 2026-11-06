export const ConvertToRefundModalSelector = {
    Page: 'ConvertToRefund.Page',
    Picker: 'ConvertToRefund.Picker',
    SearchInput: 'ConvertToRefund.SearchInput',
    DoneButton: 'ConvertToRefund.DoneButton',
    ConvertButton: 'ConvertToRefund.ConvertButton',
    RevertButton: 'ConvertToRefund.RevertButton',
    CandidateRow: (id: number) => `ConvertToRefund.CandidateRow.${id}` as const
} as const;
