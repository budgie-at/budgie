import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly label: string;
    readonly value: string;
    readonly valueClassName?: string;
}

export const CurrencyMarketHoldingMetricRow = ({ label, value, valueClassName }: Props) => (
    <View className="flex-row items-center justify-between gap-x-xl">
        <Text className="text-secondary-foreground min-w-0 flex-1 text-xs uppercase" numberOfLines={1}>
            {label}
        </Text>
        <ProtectedText
            selectable
            adjustsFontSizeToFit
            className={cn('text-primary max-w-[58%] text-right text-base font-semibold', valueClassName)}
            minimumFontScale={0.65}
            placeholderText="***"
            numberOfLines={1}
        >
            {value}
        </ProtectedText>
    </View>
);
