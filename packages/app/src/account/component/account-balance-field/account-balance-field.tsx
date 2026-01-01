import { Control, Controller, Path, UseControllerReturn } from 'react-hook-form';

import { FormAmountInput } from '../../../@generic/component/form-amount-input/form-amount-input';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props<T extends { currentBalance: number }> {
    readonly control: Control<T>;
    readonly instrumentSymbol: string;
    readonly instrumentId?: number;
    readonly variant: ColorPaletteVariant;
    readonly onInstrumentChange?: (instrumentId: number) => void;
}

export const AccountBalanceField = <T extends { currentBalance: number }>(props: Props<T>) => {
    const { control, instrumentSymbol, instrumentId, variant, onInstrumentChange } = props;

    const renderInput = ({ field: { value, onChange } }: UseControllerReturn<T, Path<T>>) => (
        <FormAmountInput
            value={value}
            instrumentSymbol={instrumentSymbol}
            instrumentId={instrumentId}
            variant={variant}
            onChange={onChange}
            onInstrumentChange={onInstrumentChange}
        />
    );

    return <Controller control={control} name={'currentBalance' as Path<T>} render={renderInput} />;
};
