import { Text, View } from 'react-native';

interface Props {
    readonly title: string;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const CategorizeInboxGroupRowActionPill = ({ title }: Props) => (
    <View className="min-h-[28px] items-center justify-center rounded-full bg-surface-disc px-md py-[4px]" style={CONTINUOUS_CORNERS}>
        <Text className="text-center text-[15px] leading-[20px] font-semibold text-primary" numberOfLines={1}>
            {title}
        </Text>
    </View>
);
