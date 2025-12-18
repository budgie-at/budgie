import { cva } from 'class-variance-authority';
import React from 'react';
import { View } from 'react-native';

import { PIN_LENGTH } from '../../constant/pin-length.constant';

interface Props {
    readonly filled: number;
}

const dotVariants = cva('w-[16px] h-[16px] rounded-full border-2', {
    variants: {
        isFilled: {
            true: 'bg-primary border-primary',
            false: 'bg-secondary-background border-secondary-corner'
        }
    }
});

export const PinFormDots = ({ filled }: Props) => {
    const pinDots = Array.from({ length: PIN_LENGTH }, (_, index) => ({ isFilled: index < filled }));

    return (
        <View className="flex-row justify-center gap-x-3xl">
            {pinDots.map(({ isFilled }, index) => (
                <View key={index} className={dotVariants({ isFilled })} />
            ))}
        </View>
    );
};
