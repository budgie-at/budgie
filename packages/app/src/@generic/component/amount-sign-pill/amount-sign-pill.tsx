import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { AmountSignSegment } from '../amount-sign-segment/amount-sign-segment';

interface Props {
    readonly isIncrease: boolean;
    readonly onToggle: () => void;
}

export const AmountSignPill = ({ isIncrease, onToggle }: Props) => {
    const { t } = useLingui();

    const handleDecrease = () => {
        if (isIncrease) {
            onToggle();
        }
    };

    const handleIncrease = () => {
        if (!isIncrease) {
            onToggle();
        }
    };

    return (
        <View accessibilityRole="radiogroup" className="min-h-[44px] max-w-[280px] flex-1 flex-row gap-xxs">
            <AmountSignSegment label={t`Decrease`} selected={!isIncrease} onPress={handleDecrease} />
            <AmountSignSegment label={t`Increase`} selected={isIncrease} onPress={handleIncrease} />
        </View>
    );
};
