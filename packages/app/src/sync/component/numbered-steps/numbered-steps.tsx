import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Props {
    readonly title: string;
    readonly steps: readonly string[];
}

const STEP_STAGGER_MS = 80;
const STEP_INITIAL_DELAY_MS = 40;
const STEP_ANIMATION_DURATION_MS = 240;

export const NumberedSteps = ({ title, steps }: Props) => (
    <View className="gap-y-md">
        <Text className="px-md text-xs font-semibold uppercase tracking-widest text-secondary-foreground">{title}</Text>

        <View className="gap-y-sm">
            {steps.map((step, index) => (
                <Animated.View
                    key={step}
                    entering={FadeInDown.delay(STEP_INITIAL_DELAY_MS + STEP_STAGGER_MS * index).duration(STEP_ANIMATION_DURATION_MS)}
                    className="flex-row items-center gap-x-md rounded-2xl bg-secondary-background p-md"
                >
                    <View className="h-7 w-7 items-center justify-center rounded-full bg-primary-reverse">
                        <Text className="text-sm font-bold text-primary">{index + 1}</Text>
                    </View>
                    <Text className="flex-1 text-sm leading-snug text-primary">{step}</Text>
                </Animated.View>
            ))}
        </View>
    </View>
);
