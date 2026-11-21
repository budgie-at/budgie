import { UserIconNameEnum } from '@budgie/contracts';
import { YieldGroupEnum } from '@budgie/market';
import { View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { useIsIncreaseContrast } from '../../../@generic/hook/use-is-increase-contrast.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { YIELD_GROUP_COLOR } from '../../constant/yield-group-color.constant';

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
    const isIncreaseContrast = useIsIncreaseContrast();
    const color = YIELD_GROUP_COLOR[group];

    return (
        <View className="size-[36px] shrink-0 items-center justify-center overflow-hidden rounded-full">
            <View className={cn('absolute inset-0 opacity-15', color[isIncreaseContrast ? 'backgroundContrast' : 'background'])} />
            <Icon icon={icon} size={18} colorClassName={color[isIncreaseContrast ? 'accentContrast' : 'accent']} />
        </View>
    );
};
