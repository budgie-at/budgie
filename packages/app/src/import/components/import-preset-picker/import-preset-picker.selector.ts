export const ImportPresetPickerSelector = {
    Budgie: 'ImportScreen.PresetChip.Budgie',
    SmartBudget: 'ImportScreen.PresetChip.SmartBudget',
    FinEye: 'ImportScreen.PresetChip.FinEye',
    PresetChip: (preset: string) => `ImportScreen.PresetChip.${preset}` as const
} as const;
