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
const COMPLETED_CLASSNAME = 'bg-positive-action/55';
const FOCUSED_COMPLETED_CLASSNAME = 'bg-positive-action';
const IN_PROGRESS_CLASSNAME = 'border-[1.5px] border-dashed border-positive-action bg-positive-action/25';

export const YieldChartMiniBar = ({ bucket, max, focusDay }: Props) => {
    const share = isPositiveNumber(max) ? bucket.total / max : 0;
    const style = { height: Math.max(share * MINI_CHART_HEIGHT, MIN_BAR_HEIGHT) };
    const isFocused = isDefined(focusDay) && bucket.start <= focusDay && focusDay <= bucket.end;
    const completedClassName = isFocused ? FOCUSED_COMPLETED_CLASSNAME : COMPLETED_CLASSNAME;
    const barClassName = cn(BAR_CLASSNAME, bucket.isInProgress ? IN_PROGRESS_CLASSNAME : completedClassName);

    return <View className={barClassName} style={style} />;
};
