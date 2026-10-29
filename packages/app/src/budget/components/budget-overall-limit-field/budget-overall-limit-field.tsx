import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';

interface Props {
    readonly control: Control<BudgetFormValues>;
    readonly currencySymbol: string;
}

export const BudgetOverallLimitField = ({ control, currencySymbol }: Props) => {
    const { t } = useLingui();

    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetFormValues, 'overallLimit'>) => (
        <AmountInput
            testID={BudgetSelector.SetupOverallLimitInput}
            value={value}
            onChangeValue={onChange}
            placeholder={t`e.g. 1000`}
            valuePrefix={currencySymbol}
            size="lg"
            commitOnBlur
            selectTextOnFocus
        />
    );

    return <Controller control={control} name="overallLimit" render={render} />;
};
