import { describe, expect, it } from '@effect/vitest';

import { resolveBudgetForecastLabelLane } from '../src/budget/utils/resolve-budget-forecast-label-lane.util';

import type { BudgetForecastLabelLaneParamsInterface } from '../src/budget/interface/budget-forecast-label-lane-params.interface';

const FONT_SIZE = 11;
const LABEL_WIDTH = 110;
const WIDTH = 380;

const lineYAt = (points: BudgetForecastLabelLaneParamsInterface['lines'][number], x: number) => {
    const index = points.findIndex(point => point.x >= x);
    const end = points[Math.max(index, 1)];
    const start = points[Math.max(index, 1) - 1];

    return start.y + ((x - start.x) / (end.x - start.x)) * (end.y - start.y);
};

const expectClear = (params: BudgetForecastLabelLaneParamsInterface) => {
    const baseline = resolveBudgetForecastLabelLane(params);
    const rectTop = baseline - FONT_SIZE;
    const rectBottom = baseline + 3;
    const [, projected] = params.lines;
    const spanYs = [WIDTH - LABEL_WIDTH, WIDTH - LABEL_WIDTH / 2, WIDTH - 6].map(x => lineYAt(projected, x));

    expect(rectTop).toBeGreaterThanOrEqual(params.top);
    expect(rectBottom).toBeLessThanOrEqual(params.bottom);
    expect(params.limitY < rectTop || params.limitY > rectBottom).toBe(true);
    expect(spanYs.every(y => y < rectTop || y > rectBottom)).toBe(true);

    return baseline;
};

const params = (endY: number, limitY: number, todayY = 70): BudgetForecastLabelLaneParamsInterface => ({
    anchor: { x: WIDTH, y: endY },
    lines: [
        [
            { x: 0, y: 130 },
            { x: 240, y: todayY }
        ],
        [
            { x: 240, y: todayY },
            { x: WIDTH - 6, y: endY }
        ]
    ],
    labelWidth: LABEL_WIDTH,
    fontSize: FONT_SIZE,
    limitY,
    top: 0,
    bottom: 136
});

describe('resolveBudgetForecastLabelLane', () => {
    it('keeps "$201 under" off the rising projection and the limit line', () => {
        expect(expectClear(params(32, 28))).toBeLessThan(28);
    });

    it('keeps "$1 under" clear when the end sits on the limit', () => {
        expectClear(params(28.2, 28));
    });

    it('puts a label far under the limit just above its end point', () => {
        expect(expectClear(params(90, 28, 110))).toBe(82);
    });

    it('clears an over-limit end that rises above the limit line', () => {
        expectClear(params(18, 40));
    });
});
