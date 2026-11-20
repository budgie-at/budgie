import { Text, View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly dotClassName: string;
    readonly label: string;
    readonly amount: string;
    readonly amountClassName: string;
}

export const YieldLegendEntry = ({ dotClassName, label, amount, amountClassName }: Props) => (
    <>
        <View className={cn('h-[10px] w-[10px] rounded-full', dotClassName)} />
        <View className="flex-1">
            <Text numberOfLines={1} className="text-sm text-primary">
                {label}
            </Text>
            <Text numberOfLines={1} className={amountClassName}>
                {amount}
            </Text>
        </View>
    </>
);
