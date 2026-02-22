import { MessageDescriptor } from '@lingui/core';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useRuleSelectorModal } from '../../context/rule-selector-modal.context';

interface Option<T extends string> {
    readonly value: T;
    readonly label: MessageDescriptor;
}

interface Props<T extends string> {
    readonly value: T;
    readonly onChange: (value: T) => void;
    readonly options: Option<T>[];
    readonly sheetTitle: string;
    readonly defaultLabel: string;
    readonly testID?: string;
}

export const RuleConditionBottomSheetSelector = <T extends string>(props: Props<T>) => {
    const { value, onChange, options, sheetTitle, defaultLabel, testID } = props;
    const { t } = useLingui();
    const { openRuleSelector } = useRuleSelectorModal();

    const translatedOptions = options.map(option => ({ value: option.value, label: t(option.label) }));
    const displayLabel = translatedOptions.find(option => option.value === value)?.label ?? defaultLabel;

    const handleOpen = async () => {
        const result = await openRuleSelector({
            title: sheetTitle,
            options: translatedOptions,
            selectedValue: value
        });

        const matchedOption = translatedOptions.find(option => option.value === result);
        if (isDefined(matchedOption)) {
            onChange(matchedOption.value);
        }
    };

    return (
        <HapticPressable
            testID={testID}
            onPress={handleOpen}
            className="bg-secondary-background rounded-xl px-lg py-md border border-secondary-corner"
        >
            <Text className="text-primary text-sm">{displayLabel}</Text>
        </HapticPressable>
    );
};
