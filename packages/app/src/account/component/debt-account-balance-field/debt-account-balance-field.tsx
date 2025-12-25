import { DebtAccountCreateInputInterface } from '@budgie/contracts';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { FormAmountInput } from '../../../@generic/component/form-amount-input/form-amount-input';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly control: Control<DebtAccountCreateInputInterface>;
    readonly variant: ColorPaletteVariant;
    readonly instrumentSymbol: string;
}

export const DebtAccountBalanceField = ({ control, instrumentSymbol, variant }: Props) => {
    const renderInput = ({ field: { value, onChange } }: UseControllerReturn<DebtAccountCreateInputInterface, 'targetBalance'>) => (
        <FormAmountInput value={value} instrumentSymbol={instrumentSymbol} variant={variant} onChange={onChange} />
    );

    return <Controller control={control} name="targetBalance" render={renderInput} />;
};
