import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFundFormValues } from '../../constant/budget-fund-form-schema.constant';

interface Props {
    readonly currencySymbol: string;
}

export const BudgetFundTargetField = ({ currencySymbol }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetFundFormValues>();

    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetFundFormValues, 'targetAmount'>) => (
        <FormItem label={t`Target amount`}>
            <AmountInput
                testID={BudgetSelector.FundTargetInput}
                value={value}
                onChangeValue={onChange}
                placeholder={t`e.g. 900`}
                valuePrefix={currencySymbol}
                size="md"
                commitOnBlur
                selectTextOnFocus
            />
        </FormItem>
    );

    return <Controller control={control} name="targetAmount" render={render} />;
};
