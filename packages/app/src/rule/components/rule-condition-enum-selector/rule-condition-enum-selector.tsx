import { RuleCreateInputInterface } from '@budgie/contracts';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { RuleConditionFormFieldEnum } from '../../enum/rule-condition-form-field.enum';
import { RuleConditionOptionInterface } from '../../interface/rule-condition-option.interface';
import { RuleFieldValueType } from '../../type/rule-field-value.type';
import { RuleConditionBottomSheetSelector } from '../rule-condition-bottom-sheet-selector/rule-condition-bottom-sheet-selector';

interface Props<T extends RuleConditionFormFieldEnum> {
    readonly index: number;
    readonly options: RuleConditionOptionInterface<RuleFieldValueType<T>>[];
    readonly fieldName: T;
    readonly label: string;
    readonly sheetTitle: string;
    readonly defaultLabel: string;
    readonly testID?: string;
}

export const RuleConditionEnumSelector = <T extends RuleConditionFormFieldEnum>(props: Props<T>) => {
    const { index, options, fieldName, label, sheetTitle, defaultLabel, testID } = props;
    const { control } = useFormContext<RuleCreateInputInterface>();

    const renderSelector = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, `conditions.${number}.${T}`>) => (
        <RuleConditionBottomSheetSelector
            value={value}
            onChange={onChange}
            options={options}
            sheetTitle={sheetTitle}
            defaultLabel={defaultLabel}
            testID={testID}
        />
    );

    return (
        <FormItem className="flex-1" label={label}>
            <Controller control={control} name={`conditions.${index}.${fieldName}`} render={renderSelector} />
        </FormItem>
    );
};
