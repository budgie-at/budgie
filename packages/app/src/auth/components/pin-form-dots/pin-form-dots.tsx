import { useLingui } from '@lingui/react/macro';
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

    return (
        <View
            className="flex-row justify-center gap-x-7xl py-md"
            accessible
            accessibilityLabel={t`PIN, ${enteredCount} of ${PIN_LENGTH} digits entered`}
            accessibilityLiveRegion="polite"
        >
            {Array.from({ length: PIN_LENGTH }, (_, index) => {
                const isFilled = index < filled;

                return <PinFormDot key={index} isFilled={isFilled} isError={isError} isAccepted={isAccepted} />;
            })}
        </View>
    );
};
