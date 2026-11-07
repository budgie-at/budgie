import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';

import { RulePillContent } from '../rule-pill-content/rule-pill-content';

import type { RuleDetectionType } from '../../interface/rule-detection.type';

interface Props {
    readonly ruleDetection?: RuleDetectionType;
}

const ENTERING = FadeIn.duration(150).reduceMotion(ReduceMotion.System);
const EXITING = FadeOut.duration(150).reduceMotion(ReduceMotion.System);

export const RulePillSlot = ({ ruleDetection }: Props) => (
    <Animated.View key={ruleDetection?.mode} entering={ENTERING} exiting={EXITING} className="max-w-full shrink">
        <RulePillContent ruleDetection={ruleDetection} />
    </Animated.View>
);
