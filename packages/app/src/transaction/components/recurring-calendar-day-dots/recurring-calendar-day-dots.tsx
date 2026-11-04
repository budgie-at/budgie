import { cva } from 'class-variance-authority';
import { View } from 'react-native';

const dotVariants = cva('h-[4px] w-[4px] rounded-full', {
    variants: {
        kind: {
            actual: 'bg-primary',
            actualSelected: 'bg-primary-reverse',
            forecasted: 'border border-primary',
            forecastedSelected: 'border border-primary-reverse'
        }
    }
});

interface Props {
    readonly actualDots: number;
    readonly forecastedDots: number;
    readonly isSelected: boolean;
}

export const RecurringCalendarDayDots = ({ actualDots, forecastedDots, isSelected }: Props) => (
    <View className="flex-row gap-x-0.5 -mt-0.5">
        {Array.from({ length: actualDots }, (_, index) => (
            <View key={`a-${index}`} className={dotVariants({ kind: isSelected ? 'actualSelected' : 'actual' })} />
        ))}
        {Array.from({ length: forecastedDots }, (_, index) => (
            <View key={`f-${index}`} className={dotVariants({ kind: isSelected ? 'forecastedSelected' : 'forecasted' })} />
        ))}
    </View>
);
