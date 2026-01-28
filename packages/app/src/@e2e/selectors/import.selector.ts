/* eslint-disable lingui/no-unlocalized-strings */
export const ImportSelectors = {
    CsvCard: 'Settings.ImportCsvCard',
    Page: 'ImportScreen.Page',
    PresetChip: (preset: string) => `ImportScreen.PresetChip.${preset}`,
    SubmitButton: 'ImportScreen.SubmitButton'
} as const;
