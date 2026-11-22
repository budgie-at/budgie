import { isDefined } from '@rnw-community/shared';

import type { YieldEstimateCauseGroupInterface } from '../interface/yield-estimate-cause-group.interface';
import type { YieldEstimateCauseInterface } from '@budgie/market';

export const groupYieldEstimateCauses = (causes: readonly YieldEstimateCauseInterface[]): readonly YieldEstimateCauseGroupInterface[] => {
    const daysByInstrument = new Map<string, Set<string>>();
    const sourceDayByInstrument = new Map<string, string | null>();

    causes.forEach(cause => {
        const days = daysByInstrument.get(cause.instrumentCode) ?? new Set<string>();
        days.add(cause.day);
        daysByInstrument.set(cause.instrumentCode, days);

        if (!sourceDayByInstrument.has(cause.instrumentCode) || !isDefined(sourceDayByInstrument.get(cause.instrumentCode))) {
            sourceDayByInstrument.set(cause.instrumentCode, cause.sourceDay);
        }
    });

    return [...daysByInstrument.entries()].map(([instrumentCode, days]) => ({
        instrumentCode,
        dayCount: days.size,
        sourceDay: sourceDayByInstrument.get(instrumentCode) ?? null
    }));
};
