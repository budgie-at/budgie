import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

interface Props {
    readonly label: string;
    readonly isPaid: boolean;
}

const pointVariants = cva('size-2.5 rounded-full', {
    variants: {
        isPaid: {
            true: 'bg-primary',
            false: 'border-2 border-secondary-foreground bg-primary-reverse'
        }
    }
});

export const InstallmentTimelinePoint = ({ label, isPaid }: Props) => (
    <View className="w-2/12 items-center gap-y-sm">
        <View className={pointVariants({ isPaid })} />
        <Text className="text-center text-sm font-medium text-primary">{label}</Text>
    </View>
);
