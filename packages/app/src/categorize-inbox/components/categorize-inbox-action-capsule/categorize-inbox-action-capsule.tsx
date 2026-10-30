import { Text, View } from 'react-native';

interface Props {
    readonly label: string;
    readonly variant: 'positive' | 'neutral';
}

export const CategorizeInboxActionCapsule = ({ label, variant }: Props) => {
    const isPositive = variant === 'positive';
    const surfaceClassName = isPositive ? 'bg-positive-fill' : 'bg-secondary-corner';
    const textClassName = isPositive ? 'text-white' : 'text-primary';

    return (
        <View className={`${surfaceClassName} h-[32px] items-center justify-center rounded-full px-xl`}>
            <Text className={`${textClassName} text-sm font-semibold`}>{label}</Text>
        </View>
    );
};
