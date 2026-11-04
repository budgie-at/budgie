import { cva } from 'class-variance-authority';
import { View } from 'react-native';

const dotVariants = cva('h-[5px] w-[5px] rounded-full', {
    variants: {
        kind: {
            actual: 'bg-primary',
            actualSelected: 'bg-primary-reverse',
            forecasted: 'border-[1.5px] border-primary',
            forecastedSelected: 'border-[1.5px] border-primary-reverse'
        }
    }
});

interface Props {
    readonly actualDots: number;
    readonly forecastedDots: number;
    readonly isSelected: boolean;
}

export const RecurringCalendarDayDots = ({ actualDots, forecastedDots, isSelected }: Props) => (
    <View className="absolute bottom-[4px] flex-row gap-x-[2px]">
        {Array.from({ length: actualDots }, (_, index) => (
            <View key={`a-${index}`} className={dotVariants({ kind: isSelected ? 'actualSelected' : 'actual' })} />
        ))}
        {Array.from({ length: forecastedDots }, (_, index) => (
            <View key={`f-${index}`} className={dotVariants({ kind: isSelected ? 'forecastedSelected' : 'forecasted' })} />
        ))}
    </View>
);
