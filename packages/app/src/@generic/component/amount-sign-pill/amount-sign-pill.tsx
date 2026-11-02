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
        <View accessibilityRole="radiogroup" className="min-h-[44px] w-[220px] flex-row px-[2px]">
            <View className="absolute inset-x-0 top-[4px] bottom-[4px] rounded-[9px] bg-transaction-detail-row" />
            <AmountSignSegment label={t`Decrease`} selected={!isIncrease} onPress={handleDecrease} />
            <AmountSignSegment label={t`Increase`} selected={isIncrease} onPress={handleIncrease} />
        </View>
    );
};
