import { isDefined } from '@rnw-community/shared';

import { StyledPath } from '../../../@generic/component/styled-path/styled-path';
import { YIELD_PLOT_HEIGHT } from '../../constant/yield-plot-height.constant';

import type { YieldBucketInterface } from '@budgie/market';

interface Props {
    readonly buckets: readonly YieldBucketInterface[];
    readonly xs: readonly number[];
    readonly barWidth: number;
}

const IN_PROGRESS_OPACITY = 0.45;
const HALF = 2;

export const YieldChartInProgressDim = ({ buckets, xs, barWidth }: Props) => {
    const index = buckets.findIndex(bucket => bucket.isInProgress);
    const x = xs.at(index);

    if (index < 0 || !isDefined(x)) {
        return null;
    }

    const left = x - barWidth / HALF;
    const right = x + barWidth / HALF;
    const path = ['M', left, 0, 'H', right, 'V', YIELD_PLOT_HEIGHT, 'H', left, 'Z'].join(' ');

    return <StyledPath d={path} fillClassName="accent-surface-row-opaque" fillOpacity={IN_PROGRESS_OPACITY} />;
};
