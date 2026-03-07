/* eslint-disable lingui/no-unlocalized-strings */
export const TagPickerBottomSheetSelectors = {
    Input: 'TagPickerBottomSheet.Input',
    Card: (title: string) => `TagPickerBottomSheet.Card.${title.trim()}` as const
} as const;
