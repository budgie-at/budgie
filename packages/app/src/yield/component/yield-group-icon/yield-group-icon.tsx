import { View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { useIsIncreaseContrast } from '../../../@generic/hook/use-is-increase-contrast.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { YIELD_GROUP_COLOR } from '../../constant/yield-group-color.constant';
import { YIELD_GROUP_ICON } from '../../constant/yield-group-icon.constant';

import type { YieldGroupEnum } from '@budgie/market';

interface Props {
    readonly group: YieldGroupEnum;
}

export const YieldGroupIcon = ({ group }: Props) => {
    const isIncreaseContrast = useIsIncreaseContrast();
    const color = YIELD_GROUP_COLOR[group];

    return (
        <View className="size-[36px] shrink-0 items-center justify-center overflow-hidden rounded-full">
            <View className={cn('absolute inset-0 opacity-15', color[isIncreaseContrast ? 'backgroundContrast' : 'background'])} />
            <Icon icon={YIELD_GROUP_ICON[group]} size={18} colorClassName={color[isIncreaseContrast ? 'accentContrast' : 'accent']} />
        </View>
    );
};
