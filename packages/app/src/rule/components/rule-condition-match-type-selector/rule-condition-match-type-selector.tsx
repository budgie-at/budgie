import { RuleConditionMatchTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { RuleSelectorSheet } from '../rule-selector-sheet/rule-selector-sheet';

const MATCH_TYPE_OPTIONS: { value: RuleConditionMatchTypeEnum; label: MessageDescriptor; description: MessageDescriptor }[] = [
    {
        value: RuleConditionMatchTypeEnum.ALL,
        label: msg`Match all conditions`,
        description: msg`All conditions must match for the rule to apply`
    },
    {
        value: RuleConditionMatchTypeEnum.ANY,
        label: msg`Match any condition`,
        description: msg`Any single condition matching will apply the rule`
    }
];

export const RuleConditionMatchTypeSelector = () => {
    const { t, i18n } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const sheetRef = useRef<BottomSheetInterface | null>(null);

    const options = MATCH_TYPE_OPTIONS.map(option => ({
        value: option.value,
        label: i18n.t(option.label),
        subtitle: i18n.t(option.description)
    }));


    const handleOpen = () => void sheetRef.current?.open();
    const handleClose = () => void sheetRef.current?.close();

    const renderSelector = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, 'conditionMatchType'>) => {
        const selectedOption = options.find(option => option.value === value);
        const label = selectedOption?.label ?? t`Select Matching`;

        const handleSelect = (newValue: RuleConditionMatchTypeEnum) => {
            onChange(newValue);
            handleClose();
        };

        return (
            <>
                <HapticPressable
                    onPress={handleOpen}
                    className="bg-secondary-background rounded-xl px-lg py-md border border-secondary-corner"
                >
                    <Text className="text-secondary-foreground text-sm">{label}</Text>
                </HapticPressable>
                <RuleSelectorSheet
                    ref={sheetRef}
                    title={t`Condition Matching`}
                    options={options}
                    selectedValue={value}
                    onSelect={handleSelect}
                />
            </>
        );
    };

    return <Controller control={control} name="conditionMatchType" render={renderSelector} />;
};
