export const CategorySelectorModalSelector = {
    Input: 'CategoryPickerBottomSheet.Input',
    CreateButton: 'CategoryPickerBottomSheet.CreateButton',
    Card: (title: string) => `CategoryPickerBottomSheet.Card.${title.trim()}` as const
} as const;
