import { AmountField, AmountFieldInput, AmountFieldPrefix, AmountFieldSuffix, useAmountSign } from '@budgie/amount-input';
import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { useAmountFormat } from '../../hook/use-amount-format.hook';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { AmountSignPill } from '../amount-sign-pill/amount-sign-pill';

interface Props {
    readonly value: number;
    readonly testID?: string;
    readonly instrumentSymbol: string;
    readonly variant: ColorPaletteVariant;
    readonly allowNegative?: boolean;
    readonly minimumDecimalPlaces?: number;
    readonly showInstrumentAfterAmount?: boolean;
    readonly onChange: (value: number) => void;
}

const symbolVariants = cva('', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

export const FormAmountInput = (props: Props) => {
    const {
        value,
        onChange,
        variant,
        instrumentSymbol,
        allowNegative = false,
        minimumDecimalPlaces = 0,
        testID,
        showInstrumentAfterAmount = false
    } = props;
    const format = useAmountFormat(minimumDecimalPlaces);
    const { isNegative, absoluteValue, toggleSign, changeAbsoluteValue } = useAmountSign(value, onChange);

    const effectiveVariant = allowNegative && isNegative ? 'destructive' : variant;
    const symbolClassName = symbolVariants({ variant: effectiveVariant });
    const textAlign = showInstrumentAfterAmount ? 'right' : 'left';

    return (
        <View className="flex-row items-center justify-center px-4 py-5xl h-36.5">
            {allowNegative ? (
                <View className="mr-xl flex-shrink-0">
                    <AmountSignPill isNegative={isNegative} variant={effectiveVariant} onToggle={toggleSign} />
                </View>
            ) : null}

            <AmountField fontSize={72} className="flex-1">
                {showInstrumentAfterAmount ? null : <AmountFieldPrefix className={symbolClassName}>{instrumentSymbol}</AmountFieldPrefix>}

                <AmountFieldInput
                    testID={testID}
                    value={absoluteValue}
                    format={format}
                    onChangeValue={changeAbsoluteValue}
                    className="text-primary"
                    placeholderTextColorClassName="accent-secondary-reverse-foreground"
                    placeholder={format.format(0)}
                    textAlign={textAlign}
                    selectTextOnFocus
                />

                {showInstrumentAfterAmount ? (
                    <AmountFieldSuffix scale={0.4} className={symbolClassName}>
                        {instrumentSymbol}
                    </AmountFieldSuffix>
                ) : null}
            </AmountField>
        </View>
    );
};
