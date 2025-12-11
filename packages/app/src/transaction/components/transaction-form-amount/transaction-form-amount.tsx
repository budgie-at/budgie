import { TransactionCreateEntityInterface } from '@budgie/contracts';
import { Control, Controller, UseControllerReturn, UseFormSetValue, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { FormAmountInput } from '../../../@generic/components/form-amount-input/form-amount-input';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly instrumentSymbol: string;
    readonly variant: ColorPaletteVariant;
    readonly control: Control<TransactionCreateEntityInterface>;
    readonly setValue: UseFormSetValue<TransactionCreateEntityInterface>;
}

export const TransactionFormAmount = ({ variant, setValue, control, instrumentSymbol }: Props) => {
    const entries = useWatch({ control, name: 'entries' });

    const handleAmountChange = (amount: number) => {
        setValue('amount', amount, { shouldValidate: true });

        if (entries.length === 1) {
            setValue('entries.0.amount', amount, { shouldValidate: true });
        }
    };

    const renderAmountInput = ({
        field: { value },
        fieldState: { error }
    }: UseControllerReturn<TransactionCreateEntityInterface, 'amount'>) => (
        <View>
            <FormAmountInput instrumentSymbol={instrumentSymbol} variant={variant} value={value} onChange={handleAmountChange} />

            {isNotEmptyString(error?.message) ? (
                <Text className="font-semibold text-xs text-destructive-foreground bg-destructive-background border border-destructive-corner p-lg rounded-5xl text-center mb-3xl">
                    {error.message}
                </Text>
            ) : null}
        </View>
    );

    return <Controller control={control} render={renderAmountInput} name="amount" />;
};
