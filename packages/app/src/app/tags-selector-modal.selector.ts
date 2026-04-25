export const TagsSelectorModalSelector = {
    Input: 'TagPickerBottomSheet.Input',
    CreateButton: 'TagPickerBottomSheet.CreateButton',
    DoneButton: 'tags-selector-modal-done-button',
    PrimaryButton: (title: string) => `TagPickerBottomSheet.PrimaryButton.${title.trim()}` as const,
    Card: (title: string) => `TagPickerBottomSheet.Card.${title.trim()}` as const
} as const;
