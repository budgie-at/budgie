/* eslint-disable lingui/no-unlocalized-strings */
export const AccountPickerBottomSheetSelectors = {
    Input: 'AccountPickerBottomSheet.Input',
    Card: (index: number) => `AccountPickerBottomSheet.Card.${index}`,
    Option: (title: string) => `AccountPickerBottomSheet.Option.${title.trim()}` as const
} as const;
