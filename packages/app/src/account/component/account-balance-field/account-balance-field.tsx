import { Control, Controller, Path, UseControllerReturn } from 'react-hook-form';

import { FormAmountInput } from '../../../@generic/component/form-amount-input/form-amount-input';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props<T extends { targetBalance: number }> {
    readonly control: Control<T>;
    readonly instrumentSymbol: string;
    readonly variant: ColorPaletteVariant;
}

export const AccountBalanceField = <T extends { targetBalance: number }>({ control, instrumentSymbol, variant }: Props<T>) => {
    const renderInput = ({ field: { value, onChange } }: UseControllerReturn<T, Path<T>>) => (
        <FormAmountInput value={value} instrumentSymbol={instrumentSymbol} variant={variant} onChange={onChange} />
    );

    return <Controller control={control} name={'targetBalance' as Path<T>} render={renderInput} />;
};
