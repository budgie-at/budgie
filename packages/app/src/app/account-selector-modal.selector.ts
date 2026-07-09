export const AccountSelectorModalSelector = {
    Input: 'AccountPickerBottomSheet.Input',
    CreateAction: 'AccountPickerBottomSheet.CreateAction',
    Card: (index: number) => `AccountPickerBottomSheet.Card.${index}`,
    DebtTotal: (title: string, amount: number) => `AccountPickerBottomSheet.DebtTotal.${title.trim()}.${amount}` as const,
    Option: (title: string) => `AccountPickerBottomSheet.Option.${title.trim()}` as const
} as const;
