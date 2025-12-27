import { useLingui } from '@lingui/react/macro';
import { Control, Controller, Path, UseControllerReturn } from 'react-hook-form';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props<T extends { targetBalance: number }> {
    readonly control: Control<T>;
}

export const AccountTargetBalanceField = <T extends { targetBalance: number }>({ control }: Props<T>) => {
    const { t } = useLingui();
    const { decimalPlaces, defaultCurrency } = useSettingsContext();
    const format = useFormatMoney(decimalPlaces, defaultCurrency);

    const render = ({ field: { value, onChange } }: UseControllerReturn<T, Path<T>>) => (
        <FormItem label={t`Target balance`}>
            <AmountInput placeholder={format(0)} size="lg" value={value} onChangeValue={onChange} />
        </FormItem>
    );

    return <Controller render={render} name={'targetBalance' as Path<T>} control={control} />;
};
