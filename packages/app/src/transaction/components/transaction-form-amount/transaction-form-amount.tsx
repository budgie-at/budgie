import { useFormContext, useWatch } from 'react-hook-form';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

import { TransactionFormAmountBase } from './transaction-form-amount-base';

interface Props {
    readonly instrumentSymbol: string;
    readonly variant: ColorPaletteVariant;
}

export const TransactionFormAmount = ({ variant, instrumentSymbol }: Props) => {
    const { control, setValue } = useFormContext();
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
            instrumentSymbol={instrumentSymbol}
            onAmountChange={handleAmountChange}
        />
    );
};
