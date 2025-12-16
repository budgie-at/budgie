import { AccountCreateEntityInterface } from '@budgie/contracts';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { FormAmountInput } from '../../../@generic/components/form-amount-input/form-amount-input';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly control: Control<AccountCreateEntityInterface>;
    readonly instrumentSymbol: string;
    readonly variant: ColorPaletteVariant;
}

export const AccountBalanceField = ({ control, instrumentSymbol, variant }: Props) => {
    const renderInput = ({ field: { value, onChange } }: UseControllerReturn<AccountCreateEntityInterface, 'currentBalance'>) => (
        <FormAmountInput value={value} instrumentSymbol={instrumentSymbol} variant={variant} onChange={onChange} />
    );

    return <Controller control={control} name="currentBalance" render={renderInput} />;
};
