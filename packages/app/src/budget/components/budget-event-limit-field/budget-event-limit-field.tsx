import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { BudgetSelector } from '../../budget.selector';
import { BudgetEventFormValues } from '../../constant/budget-event-form-schema.constant';
import { BudgetHeroAmountField } from '../budget-hero-amount-field/budget-hero-amount-field';

interface Props {
    readonly currencySymbol: string;
}

export const BudgetEventLimitField = ({ currencySymbol }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetEventFormValues>();

    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetEventFormValues, 'overallLimit'>) => (
        <BudgetHeroAmountField
            label={t`Event limit`}
            value={value}
            currencySymbol={currencySymbol}
            testID={BudgetSelector.EventLimitInput}
            onChange={onChange}
        />
    );

    return <Controller control={control} name="overallLimit" render={render} />;
};
