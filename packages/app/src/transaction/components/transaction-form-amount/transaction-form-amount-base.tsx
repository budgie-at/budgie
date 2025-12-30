import { TransactionCreateInputInterface } from '@budgie/contracts';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { FormAmountInput } from '../../../@generic/component/form-amount-input/form-amount-input';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly instrumentSymbol: string;
    readonly variant: ColorPaletteVariant;
    readonly onAmountChange: (amount: number) => void;
    readonly control: Control<TransactionCreateInputInterface>;
}

export const TransactionFormAmountBase = ({ variant, control, instrumentSymbol, onAmountChange }: Props) => {
    const renderAmountInput = ({
        field: { value },
        fieldState: { error }
    }: UseControllerReturn<TransactionCreateInputInterface, 'amount'>) => (
        <View>
            <FormAmountInput instrumentSymbol={instrumentSymbol} variant={variant} value={value} onChange={onAmountChange} />

            {isNotEmptyString(error?.message) ? (
                <Text className="font-semibold text-xs text-destructive-foreground bg-destructive-background border border-destructive-corner p-lg rounded-5xl text-center mb-3xl">
                    {error.message}
                </Text>
            ) : null}
        </View>
    );

    return <Controller control={control} render={renderAmountInput} name="amount" />;
};
