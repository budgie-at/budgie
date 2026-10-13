import { useLingui } from '@lingui/react/macro';
import { Control, Controller, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { FormAmountInput } from '../../../@generic/component/form-amount-input/form-amount-input';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ACCOUNT_COLOR } from '../../../account/constant/account-color.constant';
import { CreateAccountSelector } from '../../../app/(main)/create-account/create-account.selector';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';

import type { InstallmentPlanUpdateFormValues } from '../../constant/installment-plan-update-form-schema.constant';
import type { UseControllerReturn } from 'react-hook-form';

interface Props {
    readonly control: Control<InstallmentPlanUpdateFormValues>;
    readonly instrumentSymbol: string;
}

export const InstallmentPlanTotalField = ({ control, instrumentSymbol }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const [targetBalance, installmentCount] = useWatch({ control, name: ['targetBalance', 'installmentCount'] });
    const partsLabel = `${installmentCount} × ${formatDigits(targetBalance / installmentCount, instrumentSymbol)}`;

    const render = ({ field: { value, onChange } }: UseControllerReturn<InstallmentPlanUpdateFormValues, 'targetBalance'>) => (
        <FormAmountInput
            testID={CreateAccountSelector.Amount}
            value={value}
            instrumentSymbol={instrumentSymbol}
            variant={ACCOUNT_COLOR.DEBT}
            onChange={onChange}
        />
    );

    return (
        <FormItem label={t`Total`}>
            <View className="items-center gap-y-xs">
                <Controller control={control} name="targetBalance" render={render} />
                <ProtectedText className="text-md font-medium text-secondary-foreground tabular-nums">{partsLabel}</ProtectedText>
            </View>
        </FormItem>
    );
};
