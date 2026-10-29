import { Text, View } from 'react-native';

interface Props {
    readonly title: string;
}

export const TransactionSectionHeader = ({ title }: Props) => (
    <View className="-mx-5xl h-[38px] px-5xl pt-md">
        <View className="absolute inset-x-0 top-0 h-[24px] bg-surface" />
        <View className="absolute inset-x-0 top-[24px] h-[14px] bg-linear-to-b from-surface via-surface/60 to-transparent" />
        <Text className="px-3xl text-secondary-foreground text-[13px] font-semibold" numberOfLines={1}>
            {title}
        </Text>
    </View>
);
