import { Text, View } from 'react-native';
import Animated, { FadeIn, Keyframe } from 'react-native-reanimated';

import { ENTRANCE_REDUCED_DURATION } from '../../../@generic/constant/entrance-motion.constant';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import {
    CATEGORIZE_INBOX_BAR_DURATION,
    CATEGORIZE_INBOX_BAR_EASING,
    CATEGORIZE_INBOX_BAR_EMPTY_HEIGHT,
    CATEGORIZE_INBOX_BAR_MIN_HEIGHT,
    CATEGORIZE_INBOX_BAR_STAGGER,
    CATEGORIZE_INBOX_BAR_START_SCALE,
    CATEGORIZE_INBOX_BAR_STRIP_HEIGHT
} from '../../constant/categorize-inbox-bar-motion.constant';

interface Props {
    readonly count: number;
    readonly maxCount: number;
    readonly index: number;
    readonly monthLabel: string;
    readonly className: string;
}

export const CategorizeInboxMonthlyBar = ({ count, maxCount, index, monthLabel, className }: Props) => {
    const reducedMotion = useReducedMotion();

    const hasData = count > 0;
    const dataHeight = Math.max(CATEGORIZE_INBOX_BAR_MIN_HEIGHT, (count / maxCount) * CATEGORIZE_INBOX_BAR_STRIP_HEIGHT);
    const height = hasData ? dataHeight : CATEGORIZE_INBOX_BAR_EMPTY_HEIGHT;
    const barClassName = hasData ? className : 'bg-secondary-foreground/20';
    const style = { height, width: '100%', maxWidth: 24, borderRadius: 3, transformOrigin: 'bottom' } as const;
    const stripStyle = { height: CATEGORIZE_INBOX_BAR_STRIP_HEIGHT };
    const countLabel = hasData ? `${count}` : '';
    const growEntering = new Keyframe({
        from: { opacity: 0, transform: [{ scaleY: CATEGORIZE_INBOX_BAR_START_SCALE }] },
        to: { opacity: 1, transform: [{ scaleY: 1 }], easing: CATEGORIZE_INBOX_BAR_EASING }
    })
        .duration(CATEGORIZE_INBOX_BAR_DURATION)
        .delay(index * CATEGORIZE_INBOX_BAR_STAGGER);
    const entering = reducedMotion ? FadeIn.duration(ENTRANCE_REDUCED_DURATION) : growEntering;

    return (
        <View className="min-w-0 flex-1 items-center gap-y-xs">
            <Text className="text-secondary-foreground h-[13px] text-[11px] leading-[13px] tabular-nums" numberOfLines={1}>
                {countLabel}
            </Text>
            <View className="w-full items-center justify-end" style={stripStyle}>
                <Animated.View entering={entering} className={barClassName} style={style} />
            </View>
            <Text className="text-secondary-foreground text-[11px] leading-[13px]" numberOfLines={1}>
                {monthLabel}
            </Text>
        </View>
    );
};
