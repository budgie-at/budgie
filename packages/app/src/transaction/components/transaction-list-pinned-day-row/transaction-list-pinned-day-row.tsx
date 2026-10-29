import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { PINNED_DAY_HEIGHT } from '../../constant/pinned-day-height.constant';
import { TransactionSectionHeader } from '../transaction-section-header/transaction-section-header';

import type { TransactionsByDaySectionInterface } from '../../interface/transactions-by-day-section.interface';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly section: TransactionsByDaySectionInterface | null;
    readonly position: number;
    readonly stackOffset: SharedValue<number>;
}

const FADE_OUT_DISTANCE = PINNED_DAY_HEIGHT / 2;

export const TransactionListPinnedDayRow = ({ section, position, stackOffset }: Props) => {
    const fadeStyle = useAnimatedStyle(() => ({
        opacity: Math.min(Math.max(1 + (position * PINNED_DAY_HEIGHT + stackOffset.value) / FADE_OUT_DISTANCE, 0), 1)
    }));

    return (
        <Animated.View className="h-[32px] px-5xl" style={fadeStyle}>
            {isDefined(section) ? <TransactionSectionHeader title={section.title} netAmount={section.netAmount} /> : null}
        </Animated.View>
    );
};
