import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../utils/cn.util';
import { Icon } from '../icon/icon';

import type { ChartSwatchInterface } from '../../interface/chart-swatch.interface';
import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconType;
    readonly swatch: ChartSwatchInterface | null;
}

export const StatisticsRankingIcon = ({ icon, swatch }: Props) => {
    const backgroundClassName = isDefined(swatch) ? swatch.soft : 'bg-secondary-foreground/15';
    const iconClassName = isDefined(swatch) ? swatch.text : 'text-secondary-foreground';

    return (
        <View className={cn('size-[32px] items-center justify-center rounded-full', backgroundClassName)}>
            <Icon icon={icon} size={16} className={iconClassName} />
        </View>
    );
};
