import { cn } from 'cn';
import { View, type ViewStyle } from 'react-native';

interface Props {
    readonly percentage: number;
    readonly className?: string;
}

export const DebtProgressTrack = ({ percentage, className }: Props) => {
    const progressStyle: ViewStyle = { width: `${percentage}%` };

    return (
        <View className={cn('overflow-hidden rounded-full bg-secondary-background', className)}>
            <View className="h-full rounded-full bg-primary" style={progressStyle} />
        </View>
    );
};
