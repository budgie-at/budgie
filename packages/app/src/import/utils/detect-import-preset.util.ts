import { IMPORT_PRESETS, ImportPresetEnum } from '@budgie/import-export';

export const detectImportPreset = (headers: readonly string[]): ImportPresetEnum | null => {
    const matchingPresets = Object.values(ImportPresetEnum).filter(preset => {
        const { toAccount, category, operatedAt, toAmount, toCurrency } = IMPORT_PRESETS[preset];

        return [toAccount, category, operatedAt, toAmount, toCurrency].every(header => headers.includes(header));
    });

    return matchingPresets.length === 1 ? (matchingPresets.at(0) ?? null) : null;
};
