import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';

const CATEGORY_LIMIT_AMOUNT_INPUT_STYLE = {
    minWidth: 104,
    maxWidth: 136,
    textAlign: 'right' as const
};

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const BudgetCategoryLimitAmountInput = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetFormValues>();

    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetFormValues, `categoryLimits.${number}.limitAmount`>) => (
        <AmountInput
            testID={testID}
            value={value}
            onChangeValue={onChange}
            placeholder={t`e.g. 200`}
            size="md"
            style={CATEGORY_LIMIT_AMOUNT_INPUT_STYLE}
        />
    );

    return <Controller control={control} name={`categoryLimits.${index}.limitAmount`} render={render} />;
};
