import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { YieldScreenContext } from '../context/yield-screen.context';
import { buildYieldAxis } from '../utils/build-yield-axis.util';
import { buildYieldSummaryAxis } from '../utils/build-yield-summary-axis.util';

import type { YieldAxisInterface } from '../interface/yield-axis.interface';
import type { YieldSummaryInterface } from '@budgie/market';

export const useYieldChartAxis = (summary: YieldSummaryInterface | null): YieldAxisInterface => {
    const { screenKey, mode } = use(YieldScreenContext);

    return isDefined(summary) ? buildYieldSummaryAxis(summary, screenKey.key.group, mode) : buildYieldAxis(0, 0);
};
