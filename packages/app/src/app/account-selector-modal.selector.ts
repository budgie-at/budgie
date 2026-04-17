export const AccountSelectorModalSelector = {
    Input: 'AccountPickerBottomSheet.Input',
    Card: (index: number) => `AccountPickerBottomSheet.Card.${index}`,
    Option: (title: string) => `AccountPickerBottomSheet.Option.${title.trim()}` as const
} as const;
