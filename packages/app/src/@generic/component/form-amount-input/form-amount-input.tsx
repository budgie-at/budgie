import { cva } from 'class-variance-authority';
import { useRef } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { useAutoScaleFont } from '../../hook/use-auto-scale-font.hook';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { AmountInput } from '../amount-input/amount-input';
import { CurrencySelectorBottomSheet } from '../currency-selector-bottom-sheet/currency-selector-bottom-sheet';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

const BASE_FONT_SIZE = 72;

interface Props {
    readonly value: number;
    readonly textClassName?: string;
    readonly instrumentSymbol: string;
    readonly instrumentId?: number;
    readonly variant: ColorPaletteVariant;
    readonly onChange: (value: number) => void;
    readonly onInstrumentChange?: (instrumentId: number) => void;
}

const textVariants = cva('', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

export const FormAmountInput = (props: Props) => {
    const { value, onChange, variant, textClassName, instrumentSymbol, instrumentId, onInstrumentChange } = props;
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const currencySheetRef = useRef<BottomSheetInterface>(null);

    const displayedText = value === 0 ? '' : formatDigits(value.toString());
    const fullText = `${instrumentSymbol} ${displayedText}`;
    const { fontSize, onContainerLayout } = useAutoScaleFont(BASE_FONT_SIZE, fullText);

    const fontSizeStyle = { fontSize };

    const handleCurrencyPress = () => currencySheetRef.current?.open();

    const isCurrencySelectable = isDefined(onInstrumentChange) && isDefined(instrumentId);

    const currencyText = (
        <Text className={textVariants({ variant })} style={fontSizeStyle}>
            {instrumentSymbol}{' '}
        </Text>
    );

    return (
        <>
            <View className="flex-row items-center justify-center pl-4 pr-4 py-5xl px-lg h-36.5" onLayout={onContainerLayout}>
                {isCurrencySelectable ? <HapticPressable onPress={handleCurrencyPress}>{currencyText}</HapticPressable> : currencyText}

                <AmountInput
                    value={value}
                    onChangeValue={onChange}
                    inputClassName={cn('text-primary placeholder-secondary-reverse-foreground border-0 h-auto', textClassName)}
                    placeholder={formatDigits(0)}
                    style={fontSizeStyle}
                />
            </View>

            {isCurrencySelectable ? (
                <CurrencySelectorBottomSheet ref={currencySheetRef} selectedInstrumentId={instrumentId} onSelect={onInstrumentChange} />
            ) : null}
        </>
    );
};
