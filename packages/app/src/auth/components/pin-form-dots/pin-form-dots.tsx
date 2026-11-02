import { useLingui } from '@lingui/react/macro';
import React from 'react';
import { View } from 'react-native';

import { PIN_LENGTH } from '../../constant/pin-length.constant';
import { PinFormDot } from '../pin-form-dot/pin-form-dot';

interface Props {
    readonly filled: number;
    readonly isError: boolean;
    readonly isAccepted: boolean;
}

export const PinFormDots = ({ filled, isError, isAccepted }: Props) => {
    const { t } = useLingui();
    const enteredCount = isError ? 0 : filled;
    const pinDots = Array.from({ length: PIN_LENGTH }, (_, index) => ({ isFilled: index < filled }));

    return (
        <View
            className="flex-row justify-center gap-x-7xl py-md"
            accessible
            accessibilityLabel={t`PIN, ${enteredCount} of ${PIN_LENGTH} digits entered`}
            accessibilityLiveRegion="polite"
        >
            {pinDots.map(({ isFilled }, index) => (
                <PinFormDot key={index} isFilled={isFilled} isError={isError} isAccepted={isAccepted} />
            ))}
        </View>
    );
};
