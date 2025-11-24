import { AccountCreateEntityInterface } from '@budgie/contracts';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { AccountBalanceInput } from '../account-balance-input/account-balance-input';

interface Props {
    readonly control: Control<AccountCreateEntityInterface>;
    readonly instrumentSymbol: string;
    readonly variant: ColorPaletteVariant;
}

export const AccountBalanceField = ({ control, instrumentSymbol, variant }: Props) => {
    const renderInput = ({ field: { value, onChange } }: UseControllerReturn<AccountCreateEntityInterface, 'currentBalance'>) => (
        <AccountBalanceInput instrumentSymbol={instrumentSymbol} variant={variant} value={value} onChange={onChange} />
    );

    return <Controller control={control} name="currentBalance" render={renderInput} />;
};
