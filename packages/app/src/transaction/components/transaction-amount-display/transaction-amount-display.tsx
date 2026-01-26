import { cva } from 'class-variance-authority';
import { forwardRef, useImperativeHandle } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Ticker } from '../../../@generic/component/ticker/ticker';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly amount: string;
    readonly currencySymbol: string;
    readonly variant: ColorPaletteVariant;
}

export interface TransactionAmountDisplayRef {
    shake: () => void;
}

const textVariants = cva('', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

export const TransactionAmountDisplay = forwardRef<TransactionAmountDisplayRef, Props>(({ amount, currencySymbol, variant }, ref) => {
    const { shake, animatedStyle } = useShakeAnimation();

    useImperativeHandle(ref, () => ({ shake }));

    const fullDisplay = `${currencySymbol} ${amount}`;

    return (
        <Animated.View entering={FadeIn.duration(200)} className="flex-1 items-center justify-center px-xl">
            <Animated.View style={animatedStyle} className="w-full">
                <Ticker
                    number={fullDisplay}
                    textClassName={`font-extralight ${textVariants({ variant })}`}
                    fontSize={56}
                    minFontSize={24}
                    maxFontSize={72}
                />
            </Animated.View>
        </Animated.View>
    );
});
