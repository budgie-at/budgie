import { cva } from 'class-variance-authority';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { useAutoScaleFont } from '../../hook/use-auto-scale-font.hook';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { AmountInput } from '../amount-input/amount-input';
import { SignTogglePill } from '../sign-toggle-pill/sign-toggle-pill';

const BASE_FONT_SIZE = 72;

interface Props {
    readonly value: number;
    readonly textClassName?: string;
    readonly instrumentSymbol: string;
    readonly variant: ColorPaletteVariant;
    readonly allowNegative?: boolean;
    readonly autoFocus?: boolean;
    readonly onChange: (value: number) => void;
}

const textVariants = cva('', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

// eslint-disable-next-line max-statements -- Form orchestration component with multiple hooks and handlers
export const FormAmountInput = (props: Props) => {
    const { value, onChange, variant, textClassName, instrumentSymbol, allowNegative = false, autoFocus } = props;
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const [isNegative, setIsNegative] = useState(value < 0);
    const [previousValue, setPreviousValue] = useState(value);

    if (value !== previousValue) {
        setPreviousValue(value);

        if (value !== 0) {
            setIsNegative(value < 0);
        }
    }

    const absoluteValue = Math.abs(value);
    const displayedText = absoluteValue === 0 ? '' : formatDigits(absoluteValue.toString());
    const effectiveVariant = allowNegative && isNegative ? 'destructive' : variant;

    const fullText = `${instrumentSymbol} ${displayedText}`;
    const { fontSize, onContainerLayout } = useAutoScaleFont(BASE_FONT_SIZE, fullText);

    const fontSizeStyle = { fontSize };

    const handleToggleSign = () => {
        const newIsNegative = !isNegative;
        setIsNegative(newIsNegative);

        if (absoluteValue !== 0) {
            onChange(newIsNegative ? -absoluteValue : absoluteValue);
        }
    };

    const handleAmountChange = (newAbsoluteValue: number) => {
        onChange(isNegative ? -newAbsoluteValue : newAbsoluteValue);
    };

    return (
        <View className="flex-row items-center justify-center pl-4 pr-4 py-5xl px-lg h-36.5" onLayout={onContainerLayout}>
            {allowNegative ? (
                <View className="mr-xl">
                    <SignTogglePill isNegative={isNegative} variant={effectiveVariant} onToggle={handleToggleSign} />
                </View>
            ) : null}

            <Text className={textVariants({ variant: effectiveVariant })} style={fontSizeStyle}>
                {instrumentSymbol}{' '}
            </Text>

            <AmountInput
                value={absoluteValue}
                onChangeValue={handleAmountChange}
                inputClassName={cn('text-primary placeholder-secondary-reverse-foreground border-0 h-auto', textClassName)}
                placeholder={formatDigits(0)}
                autoFocus={autoFocus}
                style={fontSizeStyle}
            />
        </View>
    );
};
