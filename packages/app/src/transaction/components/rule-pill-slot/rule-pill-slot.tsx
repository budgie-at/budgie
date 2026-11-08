import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { EASE_OUT, MOTION_BASE_DURATION, MOTION_LAYOUT } from '../../../@generic/constant/motion.constant';
import { RulePillContent } from '../rule-pill-content/rule-pill-content';

import type { RuleDetectionType } from '../../interface/rule-detection.type';

interface Props {
    readonly ruleDetection?: RuleDetectionType;
}

const EXIT_DURATION = 80;
const ENTERING = FadeIn.delay(MOTION_BASE_DURATION).duration(MOTION_BASE_DURATION).easing(EASE_OUT);
const EXITING = FadeOut.duration(EXIT_DURATION).easing(EASE_OUT);

export const RulePillSlot = ({ ruleDetection }: Props) => (
    <Animated.View key={ruleDetection?.mode} entering={ENTERING} exiting={EXITING} layout={MOTION_LAYOUT} className="max-w-full shrink">
        <RulePillContent ruleDetection={ruleDetection} />
    </Animated.View>
);
