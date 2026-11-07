import { View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';

import { isString } from '@rnw-community/shared';

import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';
import { NumberedStepRow } from '../numbered-step-row/numbered-step-row';

import type { NumberedStepInterface } from '../../interface/numbered-step.interface';

interface Props {
    readonly title: string;
    readonly steps: readonly (string | NumberedStepInterface)[];
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;
const FADE_IN_DURATION_MS = 240;

export const NumberedSteps = ({ title, steps }: Props) => {
    const normalizedSteps = steps.map(step => (isString(step) ? { title: step, caption: null } : step));

    return (
        <Animated.View entering={FadeIn.duration(FADE_IN_DURATION_MS).reduceMotion(ReduceMotion.System)}>
            <GroupedListSectionTitle title={title} />

            <View className="gap-y-xs rounded-3xl bg-surface-row py-md" style={CONTINUOUS_CORNERS}>
                {normalizedSteps.map((step, index) => (
                    <NumberedStepRow key={step.title} title={step.title} caption={step.caption} index={index} />
                ))}
            </View>
        </Animated.View>
    );
};
