import { YieldRangeEnum } from '@budgie/market';
import { createContext } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { YieldChartModeEnum } from '../enum/yield-chart-mode.enum';

import type { YieldScreenContextInterface } from '../interface/yield-screen-context.interface';

export const YieldScreenContext = createContext<YieldScreenContextInterface>({
    screenKey: {
        key: { range: YieldRangeEnum.YEAR, positionAccountId: null, instrumentId: null, group: null, baseInstrumentId: 0 },
        focusDay: null,
        from: null,
        scopeId: null,
        period: null
    },
    mode: YieldChartModeEnum.BARS,
    rangeCaption: '',
    isPeriodCaption: false,
    setMode: emptyFn
});
