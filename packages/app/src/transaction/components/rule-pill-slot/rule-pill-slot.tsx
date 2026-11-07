import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { EASE_OUT, MOTION_BASE_DURATION } from '../../../@generic/constant/motion.constant';
import { RulePillContent } from '../rule-pill-content/rule-pill-content';

import type { RuleDetectionType } from '../../interface/rule-detection.type';

interface Props {
    readonly ruleDetection?: RuleDetectionType;
}

const ENTER_DELAY = 60;
const EXIT_DURATION = 80;
const ENTERING = FadeIn.duration(MOTION_BASE_DURATION).easing(EASE_OUT).delay(ENTER_DELAY);
const EXITING = FadeOut.duration(EXIT_DURATION).easing(EASE_OUT);

export const RulePillSlot = ({ ruleDetection }: Props) => (
    <Animated.View key={ruleDetection?.mode} entering={ENTERING} exiting={EXITING} className="max-w-full shrink">
        <RulePillContent ruleDetection={ruleDetection} />
    </Animated.View>
);
