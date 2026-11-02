import { ImportPresetEnum } from '@budgie/import-export';
import { useLingui } from '@lingui/react/macro';

import { GroupedListCheckRow } from '../../../@generic/component/grouped-list-check-row/grouped-list-check-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';

import { ImportPresetPickerSelector } from './import-preset-picker.selector';

interface Props {
    readonly detectedPreset?: ImportPresetEnum;
    readonly selectedPreset: ImportPresetEnum | undefined;
    readonly onPresetSelect: (preset: ImportPresetEnum) => void;
}

export const ImportPresetPicker = ({ selectedPreset, detectedPreset, onPresetSelect }: Props) => {
    const { t } = useLingui();

    const handleBudgieSelect = () => void onPresetSelect(ImportPresetEnum.Budgie);
    const handleSmartBudgetSelect = () => void onPresetSelect(ImportPresetEnum.SmartBudget);
    const handleFinEyeSelect = () => void onPresetSelect(ImportPresetEnum.FinEye);

    const budgieSubtitle = detectedPreset === ImportPresetEnum.Budgie ? t`Detected from column names` : '';
    const smartBudgetSubtitle = detectedPreset === ImportPresetEnum.SmartBudget ? t`Detected from column names` : '';
    const finEyeSubtitle = detectedPreset === ImportPresetEnum.FinEye ? t`Detected from column names` : '';

    return (
        <GroupedListSection title={t`Format`} footer={t`Pick the app that exported this file, or match columns yourself.`}>
            <GroupedListCheckRow
                testID={ImportPresetPickerSelector.Budgie}
                title={t`Budgie`}
                subtitle={budgieSubtitle}
                isSelected={selectedPreset === ImportPresetEnum.Budgie}
                onPress={handleBudgieSelect}
            />
            <GroupedListCheckRow
                testID={ImportPresetPickerSelector.SmartBudget}
                title={t`SmartBudget`}
                subtitle={smartBudgetSubtitle}
                isSelected={selectedPreset === ImportPresetEnum.SmartBudget}
                onPress={handleSmartBudgetSelect}
            />
            <GroupedListCheckRow
                testID={ImportPresetPickerSelector.FinEye}
                title={t`FinEye`}
                subtitle={finEyeSubtitle}
                isSelected={selectedPreset === ImportPresetEnum.FinEye}
                onPress={handleFinEyeSelect}
            />
        </GroupedListSection>
    );
};
