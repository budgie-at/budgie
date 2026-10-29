import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { BudgetSelector } from '../../budget.selector';
import { BudgetEventFormValues } from '../../constant/budget-event-form-schema.constant';

interface Props {
    readonly currencySymbol: string;
}

export const BudgetEventLimitField = ({ currencySymbol }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetEventFormValues>();

    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetEventFormValues, 'overallLimit'>) => (
        <FormItem label={t`Limit`}>
            <AmountInput
                testID={BudgetSelector.EventLimitInput}
                value={value}
                onChangeValue={onChange}
                placeholder={t`e.g. 1000`}
                valuePrefix={currencySymbol}
                size="lg"
                commitOnBlur
                selectTextOnFocus
            />
        </FormItem>
    );

    return <Controller control={control} name="overallLimit" render={render} />;
};
