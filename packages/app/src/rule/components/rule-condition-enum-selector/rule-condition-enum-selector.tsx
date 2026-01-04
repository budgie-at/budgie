import { RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';
import { Text, View } from 'react-native';

import { RuleConditionBottomSheetSelector } from '../rule-condition-bottom-sheet-selector/rule-condition-bottom-sheet-selector';

import { ConditionFieldType } from './condition-field.type';
import { ConditionOptionInterface } from './condition-option.interface';
import { FieldValueType } from './field-value.type';

interface Props<T extends ConditionFieldType> {
    readonly index: number;
    readonly options: ConditionOptionInterface<FieldValueType<T>>[];
    readonly fieldName: T;
    readonly label: string;
    readonly sheetTitle: string;
    readonly defaultLabel: string;
}

export const RuleConditionEnumSelector = <T extends ConditionFieldType>(props: Props<T>) => {
    const { index, options, fieldName, label, sheetTitle, defaultLabel } = props;
    const { i18n } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();

    const translatedOptions = options.map(option => ({ value: option.value, label: i18n.t(option.label) }));
    const getLabel = (value: FieldValueType<T>) => translatedOptions.find(option => option.value === value)?.label ?? defaultLabel;

    const renderSelector = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, `conditions.${number}.${T}`>) => (
        <RuleConditionBottomSheetSelector
            value={value}
            onChange={onChange}
            options={translatedOptions}
            sheetTitle={sheetTitle}
            getLabel={getLabel}
        />
    );

    return (
        <View className="flex-1">
            <Text className="text-secondary-foreground text-xs mb-xs">{label}</Text>
            <Controller control={control} name={`conditions.${index}.${fieldName}`} render={renderSelector} />
        </View>
    );
};
