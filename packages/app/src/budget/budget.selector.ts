export const BudgetSelector = {
    WidgetEmptyState: 'BudgetWidget.EmptyState',
    WidgetCard: 'BudgetWidget.Card',
    WidgetSpentLabel: 'BudgetWidget.SpentLabel',
    WidgetCategoryRow: (categoryId: number) => `BudgetWidget.CategoryRow.${categoryId}` as const,
    WidgetCategorySpentLabel: (categoryId: number) => `BudgetWidget.CategorySpentLabel.${categoryId}` as const,
    WidgetMoreCategoriesLabel: 'BudgetWidget.MoreCategoriesLabel',
    SetupOverallLimitInput: 'BudgetSetup.OverallLimitInput',
    SetupSpentLabel: 'BudgetSetup.SpentLabel',
    SetupSaveButton: 'BudgetSetup.SaveButton',
    SetupDeleteButton: 'BudgetSetup.DeleteButton',
    SetupCategoryLimitsHeader: 'BudgetSetup.CategoryLimitsHeader',
    SetupCategoryLimitAddButton: 'BudgetSetup.CategoryLimitAddButton',
    SetupCategoryLimitRow: (index: number) => `BudgetSetup.CategoryLimit.${index}.Row` as const,
    SetupCategoryLimitAmountInput: (index: number) => `BudgetSetup.CategoryLimit.${index}.AmountInput` as const,
    SetupAllocationSummaryOverBy: 'BudgetSetup.AllocationSummary.OverBy',
    SetupAllocationSummaryRemaining: 'BudgetSetup.AllocationSummary.Remaining'
} as const;
