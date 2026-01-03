import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useFormContext, useWatch } from 'react-hook-form';

import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

import { TransactionFormAmountBase } from './transaction-form-amount-base';

interface Props {
    readonly instrumentSymbol: string;
    readonly variant: ColorPaletteVariant;
    readonly autoFocus?: boolean;
}

export const TransactionFormAmount = ({ variant, instrumentSymbol, autoFocus }: Props) => {
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const entries = useWatch<TransactionCreateInputInterface, 'entries'>({ control, name: 'entries' });

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
            autoFocus={autoFocus}
        />
    );
};
