export const ImportPresetPickerSelector = {
    PresetChip: (preset: string) => `ImportScreen.PresetChip.${preset}` as const
} as const;
