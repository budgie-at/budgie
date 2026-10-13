import { cva } from 'class-variance-authority';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

interface Props {
    readonly isPaid: boolean;
}

const pointVariants = cva('size-2 rounded-full', {
    variants: {
        isPaid: {
            true: 'bg-primary',
            false: 'border border-secondary-foreground bg-primary-reverse'
        }
    }
});

export const InstallmentTimelinePoint = ({ isPaid }: Props) => (
    <Animated.View entering={FadeIn} exiting={FadeOut} layout={LinearTransition} className="flex-1 items-center">
        <View className={pointVariants({ isPaid })} />
    </Animated.View>
);
