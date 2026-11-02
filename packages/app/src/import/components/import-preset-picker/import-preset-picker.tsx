import { ImportPresetEnum } from '@budgie/import-export';
import { useLingui } from '@lingui/react/macro';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { ImportPresetChip } from '../import-preset-chip/import-preset-chip';

import { ImportPresetPickerSelector } from './import-preset-picker.selector';

interface Props {
    readonly selectedPreset: ImportPresetEnum | undefined;
    readonly onPresetSelect: (preset: ImportPresetEnum) => void;
}

export const ImportPresetPicker = ({ selectedPreset, onPresetSelect }: Props) => {
    const { t } = useLingui();

    const handleBudgieSelect = () => void onPresetSelect(ImportPresetEnum.Budgie);
    const handleSmartBudgetSelect = () => void onPresetSelect(ImportPresetEnum.SmartBudget);
    const handleFinEyeSelect = () => void onPresetSelect(ImportPresetEnum.FinEye);

    return (
        <GroupedListSection title={t`Format`} footer={t`Pick the app that exported this file, or match columns yourself.`}>
            <ImportPresetChip
                testID={ImportPresetPickerSelector.Budgie}
                title={t`Budgie`}
                isSelected={selectedPreset === ImportPresetEnum.Budgie}
                onSelect={handleBudgieSelect}
            />
            <ImportPresetChip
                testID={ImportPresetPickerSelector.SmartBudget}
                title={t`SmartBudget`}
                isSelected={selectedPreset === ImportPresetEnum.SmartBudget}
                onSelect={handleSmartBudgetSelect}
            />
            <ImportPresetChip
                testID={ImportPresetPickerSelector.FinEye}
                title={t`FinEye`}
                isSelected={selectedPreset === ImportPresetEnum.FinEye}
                onSelect={handleFinEyeSelect}
            />
        </GroupedListSection>
    );
};
