import { Text, View } from 'react-native';
import Animated, { FadeIn, Keyframe } from 'react-native-reanimated';

import { ENTRANCE_EASING, ENTRANCE_REDUCED_DURATION } from '../../../@generic/constant/entrance-motion.constant';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';

const BAR_DURATION = 520;
const BAR_STAGGER = 22;
const BAR_START_SCALE = 0.2;
const BAR_STRIP_HEIGHT = 56;
const BAR_MIN_HEIGHT = 4;
const BAR_EMPTY_HEIGHT = 3;

interface Props {
    readonly count: number;
    readonly maxCount: number;
    readonly index: number;
    readonly monthLabel: string;
}

export const CategorizeInboxMonthlyBar = ({ count, maxCount, index, monthLabel }: Props) => {
    const reducedMotion = useReducedMotion();

    const hasData = count > 0;
    const dataHeight = Math.max(BAR_MIN_HEIGHT, (count / maxCount) * BAR_STRIP_HEIGHT);
    const height = hasData ? dataHeight : BAR_EMPTY_HEIGHT;
    const barClassName = hasData ? 'bg-secondary-foreground/60' : 'bg-secondary-foreground/20';
    const style = { height, width: '100%', maxWidth: 24, borderRadius: 3, transformOrigin: 'bottom' } as const;
    const stripStyle = { height: BAR_STRIP_HEIGHT };
    const countLabel = hasData ? `${count}` : '';
    const growEntering = new Keyframe({
        from: { opacity: 0, transform: [{ scaleY: BAR_START_SCALE }] },
        to: { opacity: 1, transform: [{ scaleY: 1 }], easing: ENTRANCE_EASING }
    })
        .duration(BAR_DURATION)
        .delay(index * BAR_STAGGER);
    const entering = reducedMotion ? FadeIn.duration(ENTRANCE_REDUCED_DURATION) : growEntering;

    return (
        <View className="min-w-0 flex-1 items-center gap-y-xs">
            <Text className="text-secondary-foreground min-h-[15px] text-[12px] leading-[15px] tabular-nums" numberOfLines={1}>
                {countLabel}
            </Text>
            <View className="w-full items-center justify-end" style={stripStyle}>
                <Animated.View entering={entering} className={barClassName} style={style} />
            </View>
            <Text className="text-secondary-foreground text-[12px] leading-[15px]" numberOfLines={1}>
                {monthLabel}
            </Text>
        </View>
    );
};
