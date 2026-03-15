/* eslint-disable lingui/no-unlocalized-strings */
export const CategoryPickerBottomSheetSelectors = {
    Input: 'CategoryPickerBottomSheet.Input',
    CreateButton: 'CategoryPickerBottomSheet.CreateButton',
    Card: (title: string) => `CategoryPickerBottomSheet.Card.${title.trim()}` as const
} as const;
