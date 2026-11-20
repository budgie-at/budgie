import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';

import type { YieldBucketInterface } from '@budgie/market';

interface Props {
    readonly bucket: Pick<YieldBucketInterface, 'start' | 'end' | 'total' | 'isInProgress'>;
    readonly max: number;
    readonly focusDay: string | null;
}

const MINI_CHART_HEIGHT = 32;
const MIN_BAR_HEIGHT = 1;
const BAR_CLASSNAME = 'flex-1 rounded-[2px]';
const FOCUSED_CLASSNAME = 'bg-yield-staking';
const NEUTRAL_CLASSNAME = 'bg-secondary-foreground';
const FOCUSED_IN_PROGRESS_CLASSNAME = 'bg-yield-staking/35';
const NEUTRAL_IN_PROGRESS_CLASSNAME = 'bg-secondary-foreground/35';

export const YieldChartMiniBar = ({ bucket, max, focusDay }: Props) => {
    const share = isPositiveNumber(max) ? bucket.total / max : 0;
    const isFocused = !isDefined(focusDay) || (bucket.start <= focusDay && focusDay <= bucket.end);
    const style = { height: Math.max(share * MINI_CHART_HEIGHT, MIN_BAR_HEIGHT) };
    const fillClassName = isFocused ? FOCUSED_CLASSNAME : NEUTRAL_CLASSNAME;
    const inProgressClassName = isFocused ? FOCUSED_IN_PROGRESS_CLASSNAME : NEUTRAL_IN_PROGRESS_CLASSNAME;
    const barClassName = cn(BAR_CLASSNAME, bucket.isInProgress ? inProgressClassName : fillClassName);

    return <View className={barClassName} style={style} />;
};
