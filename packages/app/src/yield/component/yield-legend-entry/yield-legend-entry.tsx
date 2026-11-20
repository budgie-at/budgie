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
    readonly isMuted: boolean;
}

export const YieldLegendEntry = ({ group, label, amount, amountClassName, isMuted }: Props) => {
    const isIncreaseContrast = useIsIncreaseContrast();

    const dotClassName = cn(YIELD_GROUP_COLOR[group][isIncreaseContrast ? 'backgroundContrast' : 'background'], isMuted && 'opacity-40');

    return (
        <>
            <View className="w-[12px] items-center">
                <View className={cn('h-[10px] w-[10px] rounded-full', dotClassName)} />
            </View>
            <Text className={cn('flex-1 shrink text-sm text-primary', isMuted && 'opacity-40')}>{label}</Text>
            <Text numberOfLines={1} className={cn('shrink-0 text-right', amountClassName)}>
                {amount}
            </Text>
        </>
    );
};
