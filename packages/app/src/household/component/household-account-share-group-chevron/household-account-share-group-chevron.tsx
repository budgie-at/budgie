import { UserIconNameEnum } from '@budgie/contracts';
import Animated, { ReduceMotion, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';

import { Icon } from '../../../@generic/component/icon/icon';
import { EASE_IN_OUT, MOTION_BASE_DURATION } from '../../../@generic/constant/motion.constant';

interface Props {
    readonly isExpanded: boolean;
}

const EXPANDED_ROTATION = 90;
const CHEVRON_TIMING = { duration: MOTION_BASE_DURATION, easing: EASE_IN_OUT, reduceMotion: ReduceMotion.System };

export const HouseholdAccountShareGroupChevron = ({ isExpanded }: Props) => {
    const rotation = useDerivedValue(() => withTiming(isExpanded ? EXPANDED_ROTATION : 0, CHEVRON_TIMING));
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.get()}deg` }] }));

    return (
        <Animated.View style={animatedStyle}>
            <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
        </Animated.View>
    );
};
