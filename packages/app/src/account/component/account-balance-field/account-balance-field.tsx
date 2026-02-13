import { Control, Controller, Path, UseControllerReturn } from 'react-hook-form';

import { CreateAccountSelector } from '../../../@e2e/selectors/account-form.selector';
import { FormAmountInput } from '../../../@generic/component/form-amount-input/form-amount-input';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props<T extends { currentBalance: number }> {
    readonly control: Control<T>;
    readonly instrumentSymbol: string;
    readonly variant: ColorPaletteVariant;
    readonly allowNegative?: boolean;
}

export const AccountBalanceField = <T extends { currentBalance: number }>(props: Props<T>) => {
    const { control, instrumentSymbol, variant, allowNegative } = props;

    const renderInput = ({ field: { value, onChange } }: UseControllerReturn<T, Path<T>>) => (
        <FormAmountInput
            testID={CreateAccountSelector.Amount}
            value={value}
            instrumentSymbol={instrumentSymbol}
            variant={variant}
            allowNegative={allowNegative}
            onChange={onChange}
        />
    );

    return <Controller control={control} name={'currentBalance' as Path<T>} render={renderInput} />;
};
