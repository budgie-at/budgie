import { cva } from 'class-variance-authority';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

const DOT_STAGGER_MS = 4;
const DOT_FADE_MS = 200;

const dotVariants = cva('h-1 w-1 rounded-full', {
    variants: {
        kind: {
            actual: 'bg-warning-foreground',
            actualSelected: 'bg-primary-reverse',
            forecasted: 'border border-warning-foreground',
            forecastedSelected: 'border border-primary-reverse'
        }
    }
});

interface Props {
    readonly dayOfMonth: number;
    readonly actualDots: number;
    readonly forecastedDots: number;
    readonly isSelected: boolean;
}

export const RecurringCalendarDayDots = ({ dayOfMonth, actualDots, forecastedDots, isSelected }: Props) => (
    <Animated.View entering={FadeIn.delay(dayOfMonth * DOT_STAGGER_MS).duration(DOT_FADE_MS)} className="flex-row gap-x-0.5 -mt-0.5">
        {Array.from({ length: actualDots }, (_, index) => (
            <View key={`a-${index}`} className={dotVariants({ kind: isSelected ? 'actualSelected' : 'actual' })} />
        ))}
        {Array.from({ length: forecastedDots }, (_, index) => (
            <View key={`f-${index}`} className={dotVariants({ kind: isSelected ? 'forecastedSelected' : 'forecasted' })} />
        ))}
    </Animated.View>
);
