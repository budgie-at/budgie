import { RuleConditionOperatorEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { FormItem } from '../../../@generic/component/form-item/form-item';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleConditionAmountValueInput = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const operator = useWatch({ control, name: `conditions.${index}.operator` });
    const showSecondaryValue = operator === RuleConditionOperatorEnum.BETWEEN;

    const renderValueInput = ({
        field: { value, onChange }
    }: UseControllerReturn<RuleCreateInputInterface, `conditions.${number}.value`>) => {
        const numericValue = parseFloat(value) || 0;
        const handleChange = (amount: number) => void onChange(amount.toString());

        return <AmountInput testID={testID} value={numericValue} onChangeValue={handleChange} placeholder={t`Enter amount...`} />;
    };

    const renderSecondaryValueInput = ({
        field: { value, onChange }
    }: UseControllerReturn<RuleCreateInputInterface, `conditions.${number}.secondaryValue`>) => {
        const numericValue = parseFloat(value ?? '') || 0;
        const handleChange = (amount: number) => void onChange(amount.toString());

        return <AmountInput value={numericValue} onChangeValue={handleChange} placeholder={t`Enter amount...`} />;
    };

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
