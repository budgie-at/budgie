export const ConvertToInstallmentModalSelector = {
    Page: 'ConvertToInstallment.Page',
    TotalInput: 'ConvertToInstallment.TotalInput',
    PartsLabel: 'ConvertToInstallment.PartsLabel',
    CountChip: (count: number) => `ConvertToInstallment.CountChip.${count}` as const,
    AddFeeButton: 'ConvertToInstallment.AddFeeButton',
    FeeInput: 'ConvertToInstallment.FeeInput',
    TitleInput: 'ConvertToInstallment.TitleInput',
    CreateButton: 'ConvertToInstallment.CreateButton'
} as const;
