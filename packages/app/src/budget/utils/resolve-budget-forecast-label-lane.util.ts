import { isDefined } from '@rnw-community/shared';

import type { BudgetForecastLabelLaneParamsInterface } from '../interface/budget-forecast-label-lane-params.interface';
import type { BudgetForecastPointInterface } from '../interface/budget-forecast-point.interface';

const LABEL_GAP = 8;
const DESCENT = 3;
const CLEARANCE = 2;

const lineYRanges = (points: readonly BudgetForecastPointInterface[], left: number, right: number): readonly (readonly number[])[] =>
    points.slice(1).flatMap((end, index) => {
        const start = points[index];
        const segmentLeft = Math.max(Math.min(start.x, end.x), left);
        const segmentRight = Math.min(Math.max(start.x, end.x), right);

        if (segmentLeft > segmentRight) {
            return [];
        }

        const yAt = (x: number) => (end.x === start.x ? start.y : start.y + ((x - start.x) / (end.x - start.x)) * (end.y - start.y));

        return [[Math.min(yAt(segmentLeft), yAt(segmentRight)), Math.max(yAt(segmentLeft), yAt(segmentRight))]];
    });

export const resolveBudgetForecastLabelLane = (params: BudgetForecastLabelLaneParamsInterface): number => {
    const { anchor, lines, labelWidth, fontSize, limitY, top, bottom } = params;
    const lineRanges = lines.flatMap(points => lineYRanges(points, anchor.x - labelWidth, anchor.x));
    const lineYs = lineRanges.flat();
    const isClear = (baseline: number) => {
        const rectTop = baseline - fontSize - CLEARANCE;
        const rectBottom = baseline + DESCENT + CLEARANCE;
        const crossesLine = lineRanges.some(([low, high]) => high >= rectTop && low <= rectBottom);
        const crossesLimit = limitY >= rectTop && limitY <= rectBottom;

        return rectTop >= top && rectBottom <= bottom && !crossesLine && !crossesLimit;
    };
    const highestY = Math.min(anchor.y, limitY, ...lineYs);
    const lowestY = Math.max(anchor.y, ...lineYs);
    const candidates = [
        anchor.y - LABEL_GAP,
        anchor.y + fontSize + LABEL_GAP,
        highestY - LABEL_GAP - DESCENT,
        lowestY + fontSize + LABEL_GAP
    ];
    const clearBaseline = candidates.find(isClear);

    return isDefined(clearBaseline) ? clearBaseline : Math.max(anchor.y - LABEL_GAP, top + fontSize);
};
