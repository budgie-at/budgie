export const ConvertToInstallmentModalSelector = {
    Page: 'ConvertToInstallment.Page',
    TitleInput: 'ConvertToInstallment.TitleInput',
    TotalButton: 'ConvertToInstallment.TotalButton',
    TotalInput: 'ConvertToInstallment.TotalInput',
    PartsLabel: 'ConvertToInstallment.PartsLabel',
    CountChip: (count: number) => `ConvertToInstallment.CountChip.${count}` as const,
    Timeline: 'ConvertToInstallment.Timeline',
    FeeButton: 'ConvertToInstallment.FeeButton',
    FeeInput: 'ConvertToInstallment.FeeInput',
    CreateButton: 'ConvertToInstallment.CreateButton'
} as const;
