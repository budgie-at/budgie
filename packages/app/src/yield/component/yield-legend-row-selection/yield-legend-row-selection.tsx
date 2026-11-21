import { View } from 'react-native';

import { useIsIncreaseContrast } from '../../../@generic/hook/use-is-increase-contrast.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { YIELD_GROUP_COLOR } from '../../constant/yield-group-color.constant';

import type { YieldGroupEnum } from '@budgie/market';

interface Props {
    readonly group: YieldGroupEnum;
}

export const YieldLegendRowSelection = ({ group }: Props) => {
    const isIncreaseContrast = useIsIncreaseContrast();

    const background = YIELD_GROUP_COLOR[group][isIncreaseContrast ? 'backgroundContrast' : 'background'];

    return <View pointerEvents="none" className={cn('absolute inset-y-0 inset-x-[2px] rounded-[12px] opacity-10', background)} />;
};
