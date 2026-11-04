import { Text, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';

import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';

interface Props {
    readonly title: string;
    readonly steps: readonly string[];
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;
const FADE_IN_DURATION_MS = 240;

export const NumberedSteps = ({ title, steps }: Props) => (
    <Animated.View entering={FadeIn.duration(FADE_IN_DURATION_MS).reduceMotion(ReduceMotion.System)}>
        <GroupedListSectionTitle title={title} />

        <View className="gap-y-xs rounded-3xl bg-surface-row py-md" style={CONTINUOUS_CORNERS}>
            {steps.map((step, index) => (
                <View key={step} className="min-h-[44px] flex-row items-center gap-x-xl px-3xl py-sm">
                    <View className="size-7 items-center justify-center rounded-full bg-surface-disc">
                        <Text className="text-[13px] font-semibold text-primary tabular-nums">{index + 1}</Text>
                    </View>
                    <Text className="flex-1 text-[15px] leading-[20px] text-primary">{step}</Text>
                </View>
            ))}
        </View>
    </Animated.View>
);
