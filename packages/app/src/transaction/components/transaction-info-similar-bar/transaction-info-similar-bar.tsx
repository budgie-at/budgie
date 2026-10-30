import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly accessibilityValue: string;
    readonly height: number;
    readonly label: string;
    readonly value?: string | null;
    readonly barClassName: string;
    readonly testID?: string;
}

export const TransactionInfoSimilarBar = ({ accessibilityValue, height, label, value, barClassName, testID }: Props) => {
    const barStyle = { height };

    return (
        <View
            accessible
            accessibilityLabel={`${label}, ${accessibilityValue}`}
            className="flex-1 items-center gap-y-xs justify-end"
            collapsable={false}
            testID={testID}
        >
            {isNotEmptyString(value) ? (
                <Text className="text-[11px] leading-[13px] text-secondary-foreground tabular-nums" numberOfLines={1}>
                    {value}
                </Text>
            ) : null}
            <View className={cn('w-full rounded-t-md', barClassName)} style={barStyle} />
            <Text className="text-[11px] leading-[13px] text-secondary-foreground text-center">{label}</Text>
        </View>
    );
};
