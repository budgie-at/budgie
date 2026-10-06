export const InstallmentPlanScheduleSummarySelector = {
    Root: 'InstallmentPlanScheduleSummary.Root',
    Progress: (paidCount: number, installmentCount: number) =>
        `InstallmentPlanScheduleSummary.Progress.${paidCount}_${installmentCount}` as const,
    PaidOff: 'InstallmentPlanScheduleSummary.PaidOff'
} as const;
