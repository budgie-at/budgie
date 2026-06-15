import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

interface Props {
    readonly height: number;
    readonly label: string;
    readonly value?: string | null;
    readonly testID?: string;
}

export const TransactionInfoSimilarBar = ({ height, label, value, testID }: Props) => {
    const barStyle = { height };

    return (
        <View className="flex-1 items-center gap-y-xs justify-end" collapsable={false} testID={testID}>
            {isNotEmptyString(value) ? (
                <View className="rounded-full border border-secondary-corner bg-secondary-background px-sm py-xxs">
                    <Text className="text-xxs text-primary font-semibold tabular-nums" numberOfLines={1}>
                        {value}
                    </Text>
                </View>
            ) : null}
            <View className="w-full rounded-t-lg bg-default-foreground" style={barStyle} />
            <Text className="text-xxs text-secondary-foreground">{label}</Text>
        </View>
    );
};
