import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';

interface Props {
    readonly currencySymbol: string;
    readonly name: `categoryLimits.${number}.limitAmount` | 'otherLimit';
    readonly testID?: string;
}

export const BudgetLimitAmountInput = ({ currencySymbol, name, testID }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetFormValues>();

    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetFormValues, Props['name']>) => (
        <AmountInput
            testID={testID}
            value={value}
            onChangeValue={onChange}
            placeholder={t`e.g. 200`}
            valuePrefix={currencySymbol}
            size="md"
            inputClassName="min-w-[104px] max-w-[136px] text-right"
        />
    );

    return <Controller control={control} name={name} render={render} />;
};
