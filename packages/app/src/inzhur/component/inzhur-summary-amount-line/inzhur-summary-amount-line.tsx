import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';

interface Props {
    readonly label: string;
    readonly value: string;
}

export const InzhurSummaryAmountLine = ({ label, value }: Props) => (
    <View className="flex-row items-baseline gap-x-xl">
        <Text className="flex-1 text-[15px] leading-[20px] text-secondary-foreground">{label}</Text>
        <ProtectedText className="text-[15px] leading-[20px] text-secondary-foreground tabular-nums">{value}</ProtectedText>
    </View>
);
