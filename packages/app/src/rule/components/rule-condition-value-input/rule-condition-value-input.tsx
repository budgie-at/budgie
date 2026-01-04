import { RuleConditionOperatorEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';

import { RuleTextInput } from '../rule-text-input/rule-text-input';
import { FormItem } from '../../../@generic/component/form-item/form-item';

interface Props {
    readonly index: number;
}

export const RuleConditionValueInput = ({ index }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const operator = useWatch({ control, name: `conditions.${index}.operator` });
    const showSecondaryValue = operator === RuleConditionOperatorEnum.BETWEEN;

    const valuePlaceholder = t`Enter value...`;
    const secondaryValuePlaceholder = t`Enter secondary value...`;

    const renderValueInput = ({ field: { value, onChange } }: { field: { value: string; onChange: (value: string) => void } }) => (
        <RuleTextInput value={value} onChange={onChange} placeholder={valuePlaceholder} />
    );

    const renderSecondaryValueInput = ({
        field: { value, onChange }
    }: UseControllerReturn<RuleCreateInputInterface, `conditions.${number}.secondaryValue`>) => (
        <RuleTextInput value={value ?? ''} onChange={onChange} placeholder={secondaryValuePlaceholder} />
    );

    return (
        <>
            <FormItem label={t`Value`}>
                <Controller control={control} name={`conditions.${index}.value`} render={renderValueInput} />
            </FormItem>

            {showSecondaryValue && (
                <FormItem label={t`Secondary Value`}>
                    <Controller control={control} name={`conditions.${index}.secondaryValue`} render={renderSecondaryValueInput} />
                </FormItem>
            )}
        </>
    );
};
