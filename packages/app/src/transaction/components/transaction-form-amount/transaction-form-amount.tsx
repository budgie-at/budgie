import { TransactionCreateEntityInterface } from '@budgie/contracts';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { FormAmountInput } from '../../../@generic/components/form-amount-input/form-amount-input';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly instrumentSymbol: string;
    readonly variant: ColorPaletteVariant;
    readonly control: Control<TransactionCreateEntityInterface>;
}

export const TransactionFormAmount = ({ variant, control, instrumentSymbol }: Props) => {
    const renderAmountInput = ({
        field: { value, onChange },
        fieldState: { error }
    }: UseControllerReturn<TransactionCreateEntityInterface, 'amount'>) => (
        <View>
            <FormAmountInput instrumentSymbol={instrumentSymbol} variant={variant} value={value} onChange={onChange} />

            {isNotEmptyString(error?.message) ? (
                <Text className="font-semibold text-xs text-destructive-foreground bg-destructive-background border border-destructive-corner p-lg rounded-5xl text-center mb-3xl">
                    {error.message}
                </Text>
            ) : null}
        </View>
    );

    return <Controller control={control} render={renderAmountInput} name="amount" />;
};
