const normalizePart = (value: string) => value.replace(/[^a-zA-Z0-9]+/g, '_');

/* eslint-disable lingui/no-unlocalized-strings */
export const AccountPickerBottomSheetSelectors = {
    Input: 'AccountPickerBottomSheet.Input',
    Card: (index: number) => `AccountPickerBottomSheet.Card.${index}`,
    Option: (title: string) => `AccountPickerBottomSheet.Option.${normalizePart(title)}` as const
} as const;
