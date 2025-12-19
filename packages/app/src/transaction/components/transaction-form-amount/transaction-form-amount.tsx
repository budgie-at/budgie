import { TransactionCreateEntityInterface } from '@budgie/contracts';
import { Control, UseFormSetValue, useWatch } from 'react-hook-form';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

import { TransactionFormAmountBase } from './transaction-form-amount-base';

interface Props {
    readonly instrumentSymbol: string;
    readonly variant: ColorPaletteVariant;
    readonly control: Control<TransactionCreateEntityInterface>;
    readonly setValue: UseFormSetValue<TransactionCreateEntityInterface>;
}

export const TransactionFormAmount = ({ variant, setValue, control, instrumentSymbol }: Props) => {
    const entries = useWatch({ control, name: 'entries' });

    const handleAmountChange = (amount: number) => {
        setValue('amount', amount);

        if (entries.length === 1) {
            setValue('entries.0.amount', amount);
        }
    };

    return (
        <TransactionFormAmountBase
            variant={variant}
            control={control}
            instrumentSymbol={instrumentSymbol}
            onAmountChange={handleAmountChange}
        />
    );
};
