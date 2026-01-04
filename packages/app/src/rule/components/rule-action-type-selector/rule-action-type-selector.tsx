import { RuleActionTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';
import { View } from 'react-native';

import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { RuleSelectorField } from '../rule-selector-field/rule-selector-field';
import { RuleSelectorSheet } from '../rule-selector-sheet/rule-selector-sheet';

interface Props {
    readonly index: number;
}

const ACTION_TYPE_OPTIONS: { value: RuleActionTypeEnum; label: MessageDescriptor }[] = [
    { value: RuleActionTypeEnum.SET_CATEGORY, label: msg`Set Category` },
    { value: RuleActionTypeEnum.ADD_TAG, label: msg`Add Tag` }
];

const iconSlot = <View className="w-10 h-10 bg-secondary-background rounded-full items-center justify-center" />;

export const RuleActionTypeSelector = ({ index }: Props) => {
    const { t, i18n } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const sheetRef = useRef<BottomSheetInterface | null>(null);

    const options = ACTION_TYPE_OPTIONS.map(option => ({ value: option.value, label: i18n.t(option.label), iconSlot }));

    const getLabel = (value: RuleActionTypeEnum) => options.find(option => option.value === value)?.label ?? t`Select Type`;

    const handleOpen = () => void sheetRef.current?.open();
    const handleClose = () => void sheetRef.current?.close();

    const renderSelector = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, `actions.${number}.type`>) => {
        const handleSelect = (newValue: RuleActionTypeEnum) => {
            onChange(newValue);
            handleClose();
        };

        return (
            <>
                <RuleSelectorField label={t`Action Type`} value={getLabel(value)} onPress={handleOpen} />
                <RuleSelectorSheet ref={sheetRef} title={t`Select Action Type`} options={options} selectedValue={value} onSelect={handleSelect} />
            </>
        );
    };

    return <Controller control={control} name={`actions.${index}.type`} render={renderSelector} />;
};
