import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const BudgetCategoryLimitAmountInput = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetFormValues>();

    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetFormValues, `categoryLimits.${number}.limitAmount`>) => (
        <FormItem label={t`Limit`}>
            <AmountInput testID={testID} value={value} onChangeValue={onChange} placeholder={t`e.g. 200`} size="md" />
        </FormItem>
    );

    return <Controller control={control} name={`categoryLimits.${index}.limitAmount`} render={render} />;
};
