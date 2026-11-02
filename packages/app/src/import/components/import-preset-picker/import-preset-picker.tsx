import { ImportPresetEnum } from '@budgie/import-export';
import { useLingui } from '@lingui/react/macro';

import { GroupedListCheckRow } from '../../../@generic/component/grouped-list-check-row/grouped-list-check-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';

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
            <GroupedListCheckRow
                testID={ImportPresetPickerSelector.Budgie}
                title={t`Budgie`}
                isSelected={selectedPreset === ImportPresetEnum.Budgie}
                onPress={handleBudgieSelect}
            />
            <GroupedListCheckRow
                testID={ImportPresetPickerSelector.SmartBudget}
                title={t`SmartBudget`}
                isSelected={selectedPreset === ImportPresetEnum.SmartBudget}
                onPress={handleSmartBudgetSelect}
            />
            <GroupedListCheckRow
                testID={ImportPresetPickerSelector.FinEye}
                title={t`FinEye`}
                isSelected={selectedPreset === ImportPresetEnum.FinEye}
                onPress={handleFinEyeSelect}
            />
        </GroupedListSection>
    );
};
