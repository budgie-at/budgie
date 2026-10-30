import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

interface Props {
    readonly label: string;
    readonly variant: 'positive' | 'neutral' | 'outline';
}

const surfaceVariants = cva('h-[32px] items-center justify-center rounded-full px-xl', {
    variants: {
        variant: {
            positive: 'bg-positive-action',
            neutral: 'bg-cta-background',
            outline: 'border-[1.5px] border-positive-action/45'
        }
    }
});

const labelVariants = cva('text-[15px] font-semibold', {
    variants: {
        variant: {
            positive: 'text-positive-action-foreground',
            neutral: 'text-cta-foreground',
            outline: 'text-positive-action'
        }
    }
});

export const CategorizeInboxActionCapsule = ({ label, variant }: Props) => (
    <View className={surfaceVariants({ variant })}>
        <Text className={labelVariants({ variant })}>{label}</Text>
    </View>
);
