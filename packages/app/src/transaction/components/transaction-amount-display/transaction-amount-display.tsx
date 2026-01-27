import { cva } from 'class-variance-authority';
import { RefObject, useImperativeHandle } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Ticker } from '../../../@generic/component/ticker/ticker';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

export interface TransactionAmountDisplayRef {
    shake: () => void;
}

interface Props {
    readonly ref?: RefObject<TransactionAmountDisplayRef | null>;
    readonly amount: string;
    readonly currencySymbol: string;
    readonly variant: ColorPaletteVariant;
}

const textVariants = cva('', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

export const TransactionAmountDisplay = ({ ref, amount, currencySymbol, variant }: Props) => {
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
};
