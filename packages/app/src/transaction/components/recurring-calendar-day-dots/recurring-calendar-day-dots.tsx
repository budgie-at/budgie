import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';

const dotVariants = cva('rounded-full', {
    variants: {
        kind: {
            actual: 'h-[5px] w-[5px] bg-primary',
            actualSelected: 'h-[5px] w-[5px] bg-primary-reverse',
            forecasted: 'h-[6px] w-[6px] border-[1.5px] border-primary',
            forecastedSelected: 'h-[6px] w-[6px] border-[1.5px] border-primary-reverse'
        }
    }
});

interface Props {
    readonly actualDots: number;
    readonly forecastedDots: number;
    readonly isSelected: boolean;
    readonly className?: string;
}

export const RecurringCalendarDayDots = ({ actualDots, forecastedDots, isSelected, className }: Props) => (
    <View className={cn('absolute bottom-[5px] flex-row items-center gap-x-[3px]', className)}>
        {Array.from({ length: actualDots }, (_, index) => (
            <View key={`a-${index}`} className={dotVariants({ kind: isSelected ? 'actualSelected' : 'actual' })} />
        ))}
        {Array.from({ length: forecastedDots }, (_, index) => (
            <View key={`f-${index}`} className={dotVariants({ kind: isSelected ? 'forecastedSelected' : 'forecasted' })} />
        ))}
    </View>
);
