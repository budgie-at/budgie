import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { FormAmountInput } from '../../../@generic/component/form-amount-input/form-amount-input';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { AllocationFormValues } from '../../schema/allocation-form.schema';

interface Props {
    readonly control: Control<AllocationFormValues>;
    readonly currencySymbol: string;
}

export const AllocationAmountField = ({ control, currencySymbol }: Props) => {
    const { t } = useLingui();

    const renderAmount = ({ field: { onChange, value }, fieldState: { error } }: UseControllerReturn<AllocationFormValues, 'amount'>) => (
        <FormItem label={t`Amount`} error={error?.message}>
            <FormAmountInput value={value} onChange={onChange} variant="primary" instrumentSymbol={currencySymbol} />
        </FormItem>
    );

    return <Controller name="amount" control={control} render={renderAmount} />;
};
