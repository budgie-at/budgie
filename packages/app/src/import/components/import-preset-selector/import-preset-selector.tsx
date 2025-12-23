import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ImportPresetEnum } from '../../enum/import-preset.enum';
import { ImportPresetCard } from '../import-preset-card/import-preset-card';

interface Props {
    readonly selectedPreset: ImportPresetEnum | undefined;
    readonly onPresetSelect: (preset: ImportPresetEnum) => void;
}

// eslint-disable-next-line lingui/no-unlocalized-strings
const SMART_BUDGET_TITLE = 'SmartBudget';
// eslint-disable-next-line lingui/no-unlocalized-strings
const FIN_EYE_TITLE = 'FinEye';

export const ImportPresetSelector = ({ selectedPreset, onPresetSelect }: Props) => {
    const { t } = useLingui();

    const handleSmartBudgetSelect = () => void onPresetSelect(ImportPresetEnum.SmartBudget);
    const handleFinEyeSelect = () => void onPresetSelect(ImportPresetEnum.FinEye);

    return (
        <View className="gap-y-lg mb-xl">
            <View className="gap-y-xs">
                <Text className="text-primary font-semibold text-lg">{t`Select Import Preset`}</Text>
                <Text className="text-secondary-foreground text-sm">
                    {isDefined(selectedPreset)
                        ? t`Preset applied. Adjust columns below if needed.`
                        : t`Choose a preset to auto-fill column mappings`}
                </Text>
            </View>
            <View className="flex-row gap-x-md">
                <ImportPresetCard
                    title={SMART_BUDGET_TITLE}
                    description={t`Import from SmartBudget2 app with Russian columns`}
                    isSelected={selectedPreset === ImportPresetEnum.SmartBudget}
                    onSelect={handleSmartBudgetSelect}
                />
                <ImportPresetCard
                    title={FIN_EYE_TITLE}
                    description={t`Import from FinEye app with English columns`}
                    isSelected={selectedPreset === ImportPresetEnum.FinEye}
                    onSelect={handleFinEyeSelect}
                />
            </View>
        </View>
    );
};
