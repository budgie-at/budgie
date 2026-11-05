import { Text, View } from 'react-native';

interface Props {
    readonly title: string;
    readonly value: string;
}

export const RecurringSummaryRow = ({ title, value }: Props) => (
    <View className="min-h-11 flex-row flex-wrap items-center justify-between gap-x-xl gap-y-xxs py-xs">
        <Text dynamicTypeRamp="body" className="shrink text-[16px] text-primary">
            {title}
        </Text>
        <Text dynamicTypeRamp="headline" className="text-[16px] font-semibold text-primary tabular-nums">
            {value}
        </Text>
    </View>
);
