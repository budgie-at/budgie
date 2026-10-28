import { RuleCreateInputInterface } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { RuleConditionFormFieldEnum } from '../../enum/rule-condition-form-field.enum';
import { RuleFieldValueType } from '../../type/rule-field-value.type';
import { RuleOptionPicker } from '../rule-option-picker/rule-option-picker';

type RuleConditionOptionInterface<TValue extends string> = {
    readonly value: TValue;
    readonly label: MessageDescriptor;
};

interface Props<T extends RuleConditionFormFieldEnum> {
    readonly index: number;
    readonly options: RuleConditionOptionInterface<RuleFieldValueType<T>>[];
    readonly fieldName: T;
    readonly label: string;
    readonly sheetTitle: string;
    readonly defaultLabel: string;
    readonly testID?: string;
    readonly onValueChange?: (value: RuleFieldValueType<T>) => void;
}

export const RuleConditionEnumSelector = <T extends RuleConditionFormFieldEnum>(props: Props<T>) => {
    const { index, options, fieldName, label, sheetTitle, defaultLabel, testID, onValueChange } = props;
    const { control } = useFormContext<RuleCreateInputInterface>();

    const renderSelector = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, `conditions.${number}.${T}`>) => {
        const handleChange = (selectedValue: RuleFieldValueType<T>) => {
            onChange(selectedValue);
            onValueChange?.(selectedValue);
        };

        return (
            <RuleOptionPicker
                value={value}
                onChange={handleChange}
                options={options}
                sheetTitle={sheetTitle}
                defaultLabel={defaultLabel}
                testID={testID}
            />
        );
    };

    return (
        <FormItem className="flex-1" label={label}>
            <Controller control={control} name={`conditions.${index}.${fieldName}`} render={renderSelector} />
        </FormItem>
    );
};
