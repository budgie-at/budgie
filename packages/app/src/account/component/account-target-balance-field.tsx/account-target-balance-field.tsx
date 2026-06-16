import { useLingui } from '@lingui/react/macro';
import { Control, Controller, Path, UseControllerReturn } from 'react-hook-form';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';

interface Props<T extends { targetBalance: number }> {
    readonly control: Control<T>;
    readonly instrumentSymbol: string;
}

export const AccountTargetBalanceField = <T extends { targetBalance: number }>({ control, instrumentSymbol }: Props<T>) => {
    const { t } = useLingui();
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const render = ({ field: { value, onChange } }: UseControllerReturn<T, Path<T>>) => (
        <FormItem label={t`Target balance`}>
            <AmountInput
                testID={CreateAccountScreenSelector.TargetBalanceInput}
                placeholder={formatDigits(0, instrumentSymbol)}
                size="lg"
                value={value}
                onChangeValue={onChange}
            />
        </FormItem>
    );

    return <Controller render={render} name={'targetBalance' as Path<T>} control={control} />;
};
