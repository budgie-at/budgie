export const ConsolidationSourceModalSelector = {
    Picker: 'ConsolidationSourceModal.Picker',
    Row: (index: number) => `ConsolidationSourceModal.Row.${index}` as const,
    RevertButton: 'ConsolidationSourceModal.RevertButton',
    DoneButton: 'ConsolidationSourceModal.DoneButton'
} as const;
