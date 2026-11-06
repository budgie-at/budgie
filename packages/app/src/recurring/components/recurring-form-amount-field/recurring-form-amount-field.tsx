import { useFormContext, useWatch } from 'react-hook-form';

import { BudgetHeroAmountField } from '../../../budget/components/budget-hero-amount-field/budget-hero-amount-field';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { RecurringSeriesFormSelector } from '../recurring-series-form-screen/recurring-series-form.selector';

import type { RecurringSeriesFormValues } from '../../constant/recurring-series-form-schema.constant';

interface Props {
    readonly label: string;
}

export const RecurringFormAmountField = ({ label }: Props) => {
    const { control } = useFormContext<RecurringSeriesFormValues>();
    const instrumentId = useWatch({ control, name: 'instrumentId' });
    const { instrument } = useGetInstrumentByIdQuery(instrumentId);

    return (
        <BudgetHeroAmountField
            label={label}
            control={control}
            name="amount"
            currencySymbol={instrument?.symbol ?? ''}
            testID={RecurringSeriesFormSelector.Amount}
        />
    );
};
