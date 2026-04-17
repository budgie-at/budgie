export const TagsSelectorModalSelector = {
    Input: 'TagPickerBottomSheet.Input',
    CreateButton: 'TagPickerBottomSheet.CreateButton',
    Card: (title: string) => `TagPickerBottomSheet.Card.${title.trim()}` as const
} as const;
