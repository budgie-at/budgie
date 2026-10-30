import { Text, View, useWindowDimensions } from 'react-native';

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

const MIN_COLUMN_WIDTH = 44;

export const TransactionInfoSimilarBar = ({ accessibilityValue, height, label, value, barClassName, testID }: Props) => {
    const { fontScale } = useWindowDimensions();
    const columnStyle = { minWidth: MIN_COLUMN_WIDTH * fontScale };
    const barStyle = { height };

    return (
        <View
            accessible
            accessibilityLabel={`${label}, ${accessibilityValue}`}
            className="flex-1 items-center gap-y-xs justify-end"
            collapsable={false}
            testID={testID}
            style={columnStyle}
        >
            {isNotEmptyString(value) ? (
                <Text className="text-[13px] leading-[18px] text-primary font-medium tabular-nums" numberOfLines={1}>
                    {value}
                </Text>
            ) : null}
            <View className={cn('w-full rounded-t-md', barClassName)} style={barStyle} />
            <Text className="text-[11px] leading-[13px] text-secondary-foreground text-center">{label}</Text>
        </View>
    );
};
