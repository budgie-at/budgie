import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { BudgetSelector } from '../../budget.selector';
import { BudgetFundFormValues } from '../../constant/budget-fund-form-schema.constant';
import { BudgetHeroAmountField } from '../budget-hero-amount-field/budget-hero-amount-field';

interface Props {
    readonly currencySymbol: string;
}

export const BudgetFundTargetField = ({ currencySymbol }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetFundFormValues>();

    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetFundFormValues, 'targetAmount'>) => (
        <BudgetHeroAmountField
            label={t`Amount to set aside`}
            value={value}
            currencySymbol={currencySymbol}
            testID={BudgetSelector.FundTargetInput}
            onChange={onChange}
        />
    );

    return <Controller control={control} name="targetAmount" render={render} />;
};
