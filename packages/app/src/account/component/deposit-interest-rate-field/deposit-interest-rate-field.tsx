import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { isPositiveNumber } from '@rnw-community/shared';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { DepositAccountFormValues } from '../../interface/deposit-account-form-values.interface';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';

interface Props {
    readonly control: Control<DepositAccountFormValues>;
}

export const DepositInterestRateField = ({ control }: Props) => {
    const { t } = useLingui();

    const render = ({ field: { value, onChange }, fieldState }: UseControllerReturn<DepositAccountFormValues, 'interestRate'>) => {
        const handleChangeValue = (rate: number) => void onChange(isPositiveNumber(rate) ? rate : null);

        return (
            <FormItem label={t`Interest Rate % (Optional)`} error={fieldState.error?.message}>
                <AmountInput
                    testID={CreateAccountScreenSelector.InterestRateInput}
                    value={value ?? 0}
                    onChangeValue={handleChangeValue}
                    size="lg"
                />
            </FormItem>
        );
    };

    return <Controller control={control} name="interestRate" render={render} />;
};
