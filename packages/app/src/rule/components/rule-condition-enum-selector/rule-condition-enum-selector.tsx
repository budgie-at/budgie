import { RuleConditionFieldEnum, RuleConditionOperatorEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';
import { Text, View } from 'react-native';

import { RuleConditionBottomSheetSelector } from '../rule-condition-bottom-sheet-selector/rule-condition-bottom-sheet-selector';

type ConditionFieldType = 'field' | 'operator';

type FieldValueType<T extends ConditionFieldType> = T extends 'field' ? RuleConditionFieldEnum : RuleConditionOperatorEnum;

interface Option<TValue extends string> {
    value: TValue;
    label: MessageDescriptor;
}

interface Props<T extends ConditionFieldType> {
    index: number;
    options: Option<FieldValueType<T>>[];
    fieldName: T;
    label: ReactNode;
    sheetTitle: string;
    defaultLabel: string;
}

export const RuleConditionEnumSelector = <T extends ConditionFieldType>({
    index,
    options,
    fieldName,
    label,
    sheetTitle,
    defaultLabel
}: Props<T>) => {
    const { i18n } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();

    type ValueType = FieldValueType<T>;
    type FieldName = `conditions.${number}.${T}`;

    const translatedOptions = options.map(option => ({ value: option.value, label: i18n.t(option.label) }));
    const getLabel = (value: ValueType) => translatedOptions.find(option => option.value === value)?.label ?? defaultLabel;

    const renderSelector = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, FieldName>) => (
        <RuleConditionBottomSheetSelector value={value} onChange={onChange} options={translatedOptions} sheetTitle={sheetTitle} getLabel={getLabel} />
    );

    return (
        <View className="flex-1">
            <Text className="text-secondary-foreground text-xs mb-xs">{label}</Text>
            <Controller control={control} name={`conditions.${index}.${fieldName}`} render={renderSelector} />
        </View>
    );
};
