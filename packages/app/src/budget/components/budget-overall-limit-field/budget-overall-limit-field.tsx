import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';

interface Props {
    readonly control: Control<BudgetFormValues>;
    readonly autoFocus: boolean;
}

export const BudgetOverallLimitField = ({ control, autoFocus }: Props) => {
    const { t } = useLingui();

    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetFormValues, 'overallLimit'>) => (
        <FormItem label={t`Overall monthly limit`}>
            <AmountInput
                testID={BudgetSelector.SetupOverallLimitInput}
                value={value}
                onChangeValue={onChange}
                placeholder={t`e.g. 1000`}
                size="lg"
                autoFocus={autoFocus}
            />
        </FormItem>
    );

    return <Controller control={control} name="overallLimit" render={render} />;
};
