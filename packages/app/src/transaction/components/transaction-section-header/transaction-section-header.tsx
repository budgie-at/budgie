import { Text, View } from 'react-native';

interface Props {
    readonly title: string;
}

export const TransactionSectionHeader = ({ title }: Props) => (
    <View className="-mx-5xl h-[44px] px-5xl pt-md">
        <View className="absolute inset-x-0 top-0 h-[28px] bg-surface" />
        <View className="absolute inset-x-0 top-[28px] h-[16px] bg-linear-to-b from-surface via-surface/85 to-surface/0" />
        <Text className="px-3xl text-secondary-foreground text-[13px] font-semibold" numberOfLines={1}>
            {title}
        </Text>
    </View>
);
