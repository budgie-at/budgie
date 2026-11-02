import { UserIconNameEnum } from '@budgie/contracts';
import { ImportPresetEnum } from '@budgie/import-export';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { Icon } from '../../../@generic/component/icon/icon';
import { ImportPresetOptions } from '../import-preset-options/import-preset-options';

import { ImportPresetPickerSelector } from './import-preset-picker.selector';

interface Props {
    readonly hasMappedColumns: boolean;
    readonly matchDescription: string;
    readonly detectedPreset?: ImportPresetEnum;
    readonly selectedPreset: ImportPresetEnum | undefined;
    readonly onPresetSelect: (preset: ImportPresetEnum | undefined) => void;
}

export const ImportPresetPicker = ({ selectedPreset, detectedPreset, onPresetSelect, hasMappedColumns, matchDescription }: Props) => {
    const { t } = useLingui();

    const [isExpanded, setIsExpanded] = useState(false);

    const handleSelect = (preset?: ImportPresetEnum) => {
        onPresetSelect(preset);
        setIsExpanded(false);
    };
    const handleToggle = () => void setIsExpanded(!isExpanded);
    const isCustomSelected = !isDefined(selectedPreset) && hasMappedColumns;
    const toggleProps = { accessibilityState: { expanded: isExpanded } };

    const formatNames = {
        [ImportPresetEnum.Budgie]: t`Budgie`,
        [ImportPresetEnum.SmartBudget]: t`SmartBudget`,
        [ImportPresetEnum.FinEye]: t`FinEye`
    };
    const customValue = isCustomSelected ? t`Custom` : t`Choose`;
    const selectedValue = isDefined(selectedPreset) ? formatNames[selectedPreset] : customValue;
    const customFooter =
        isCustomSelected && isNotEmptyString(matchDescription)
            ? matchDescription
            : t`Pick the app that exported this file, or match columns yourself.`;
    const formatDescription =
        isDefined(detectedPreset) && detectedPreset === selectedPreset
            ? t`Detected automatically. Tap to pick another format.`
            : customFooter;

    return (
        <GroupedListSection footer={formatDescription}>
            <GroupedListRow
                title={t`Format`}
                onPress={handleToggle}
                testID={ImportPresetPickerSelector.Toggle}
                pressableProps={toggleProps}
                right={
                    <View className="max-w-[60%] flex-row items-center gap-x-xs">
                        <Text className="shrink text-secondary-foreground text-[17px]" numberOfLines={1}>
                            {selectedValue}
                        </Text>
                        <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
                    </View>
                }
            />
            {isExpanded ? (
                <ImportPresetOptions
                    selectedPreset={selectedPreset}
                    detectedPreset={detectedPreset}
                    onPresetSelect={handleSelect}
                    hasMappedColumns={hasMappedColumns}
                    matchDescription={matchDescription}
                />
            ) : null}
        </GroupedListSection>
    );
};
