export const TagsSelectorModalSelector = {
    Input: 'TagPickerBottomSheet.Input',
    CreateButton: 'TagPickerBottomSheet.CreateButton',
    DoneButton: 'tags-selector-modal-done-button',
    Card: (title: string) => `TagPickerBottomSheet.Card.${title.trim()}` as const
} as const;
