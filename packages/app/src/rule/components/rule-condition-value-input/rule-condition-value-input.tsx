import { RuleConditionOperatorEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Input } from '../../../@generic/component/input/input';

interface Props {
    readonly index: number;
}

export const RuleConditionValueInput = ({ index }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const operator = useWatch({ control, name: `conditions.${index}.operator` });
    const showSecondaryValue = operator === RuleConditionOperatorEnum.BETWEEN;

    const renderValueInput = ({
        field: { value, onChange }
    }: UseControllerReturn<RuleCreateInputInterface, `conditions.${number}.value`>) => (
        <Input value={value} onChangeText={onChange} placeholder={t`Enter value...`} />
    );

    const renderSecondaryValueInput = ({
        field: { value, onChange }
    }: UseControllerReturn<RuleCreateInputInterface, `conditions.${number}.secondaryValue`>) => (
        <Input value={value ?? ''} onChangeText={onChange} placeholder={t`Enter secondary value...`} />
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
