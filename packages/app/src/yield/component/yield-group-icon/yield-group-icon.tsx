import { UserIconNameEnum } from '@budgie/contracts';
import { YieldGroupEnum } from '@budgie/market';
import { View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { useYieldGroupColor } from '../../hook/use-yield-group-color.hook';

const YIELD_GROUP_ICON: Readonly<Record<YieldGroupEnum, UserIconNameEnum>> = {
    [YieldGroupEnum.STAKING_EARN]: UserIconNameEnum.Layers,
    [YieldGroupEnum.INTEREST]: UserIconNameEnum.Percent,
    [YieldGroupEnum.DIVIDENDS]: UserIconNameEnum.ChartPie,
    [YieldGroupEnum.DISTRIBUTIONS]: UserIconNameEnum.HandCoins,
    [YieldGroupEnum.TAX]: UserIconNameEnum.Receipt
};

interface Props {
    readonly group: YieldGroupEnum;
    readonly icon?: UserIconNameEnum;
}

export const YieldGroupIcon = ({ group, icon = YIELD_GROUP_ICON[group] }: Props) => {
    const { background, accent } = useYieldGroupColor(group);

    return (
        <View className="size-[36px] shrink-0 items-center justify-center overflow-hidden rounded-full">
            <View className={cn('absolute inset-0 opacity-15', background)} />
            <Icon icon={icon} size={18} colorClassName={accent} />
        </View>
    );
};
