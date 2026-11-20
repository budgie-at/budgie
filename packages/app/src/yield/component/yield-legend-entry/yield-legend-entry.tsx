import { Text, View } from 'react-native';

import { useIsIncreaseContrast } from '../../../@generic/hook/use-is-increase-contrast.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { YIELD_GROUP_COLOR } from '../../constant/yield-group-color.constant';

import type { YieldGroupEnum } from '@budgie/market';

interface Props {
    readonly group: YieldGroupEnum;
    readonly label: string;
    readonly amount: string;
    readonly amountClassName: string;
    readonly isDotMuted: boolean;
}

export const YieldLegendEntry = ({ group, label, amount, amountClassName, isDotMuted }: Props) => {
    const isIncreaseContrast = useIsIncreaseContrast();

    const dotClassName = cn(YIELD_GROUP_COLOR[group][isIncreaseContrast ? 'backgroundContrast' : 'background'], isDotMuted && 'opacity-60');

    return (
        <>
            <View className="w-[12px] items-center">
                <View className={cn('h-[10px] w-[10px] rounded-full', dotClassName)} />
            </View>
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
};
