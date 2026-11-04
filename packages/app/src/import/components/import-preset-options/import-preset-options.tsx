import { ImportPresetEnum } from '@budgie/import-export';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { GroupedListCheckRow } from '../../../@generic/component/grouped-list-check-row/grouped-list-check-row';
import { ImportPresetPickerSelector } from '../import-preset-picker/import-preset-picker.selector';

interface Props {
    readonly selectedPreset: ImportPresetEnum | undefined;
    readonly detectedPreset?: ImportPresetEnum;
    readonly onPresetSelect: (preset?: ImportPresetEnum) => void;
    readonly hasMappedColumns: boolean;
    readonly matchDescription: string;
}

export const ImportPresetOptions = (props: Props) => {
    const { selectedPreset, detectedPreset, onPresetSelect, hasMappedColumns, matchDescription } = props;
    const { t } = useLingui();
    const handleBudgieSelect = () => void onPresetSelect(ImportPresetEnum.Budgie);
    const handleSmartBudgetSelect = () => void onPresetSelect(ImportPresetEnum.SmartBudget);
    const handleFinEyeSelect = () => void onPresetSelect(ImportPresetEnum.FinEye);
    const handleCustomSelect = () => void onPresetSelect();
    const budgieSubtitle = detectedPreset === ImportPresetEnum.Budgie ? t`Detected from column names` : '';
    const smartBudgetSubtitle = detectedPreset === ImportPresetEnum.SmartBudget ? t`Detected from column names` : '';
    const finEyeSubtitle = detectedPreset === ImportPresetEnum.FinEye ? t`Detected from column names` : '';
    const isCustomSelected = !isDefined(selectedPreset) && hasMappedColumns;

    return (
        <>
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
            <GroupedListCheckRow
                testID={ImportPresetPickerSelector.Custom}
                title={t`Custom`}
                subtitle={matchDescription}
                isSelected={isCustomSelected}
                onPress={handleCustomSelect}
            />
        </>
    );
};
