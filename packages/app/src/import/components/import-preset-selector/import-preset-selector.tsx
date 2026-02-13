/* eslint-disable lingui/no-unlocalized-strings */
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ImportSelectors } from '../../../@e2e/selectors/import.selector';
import { ImportPresetEnum } from '../../enum/import-preset.enum';
import { ImportPresetChip } from '../import-preset-chip/import-preset-chip';

interface Props {
    readonly selectedPreset: ImportPresetEnum | undefined;
    readonly onPresetSelect: (preset: ImportPresetEnum) => void;
}

export const ImportPresetSelector = ({ selectedPreset, onPresetSelect }: Props) => {
    const { t } = useLingui();

    const handleBudgieSelect = () => void onPresetSelect(ImportPresetEnum.Budgie);
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
            <View className="flex-row flex-wrap gap-sm">
                <ImportPresetChip
                    testID={ImportSelectors.PresetChip('Budgie')}
                    title="Budgie"
                    isSelected={selectedPreset === ImportPresetEnum.Budgie}
                    onSelect={handleBudgieSelect}
                />
                <ImportPresetChip
                    testID={ImportSelectors.PresetChip('SmartBudget')}
                    title="SmartBudget"
                    isSelected={selectedPreset === ImportPresetEnum.SmartBudget}
                    onSelect={handleSmartBudgetSelect}
                />
                <ImportPresetChip
                    testID={ImportSelectors.PresetChip('FinEye')}
                    title="FinEye"
                    isSelected={selectedPreset === ImportPresetEnum.FinEye}
                    onSelect={handleFinEyeSelect}
                />
            </View>
        </View>
    );
};
