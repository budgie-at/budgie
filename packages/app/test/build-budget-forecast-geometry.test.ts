import { computeBudgetProjection } from '@budgie/budget';
import { describe, expect, it } from '@effect/vitest';

import { buildBudgetForecastGeometry } from '../src/budget/utils/build-budget-forecast-geometry.util';

const LAYOUT = { width: 300, height: 160, paddingLeft: 0, paddingRight: 6, paddingTop: 22, paddingBottom: 24 };
const OCTOBER = 9;

const projectionWithLimit = (overallLimit: number) =>
    computeBudgetProjection({
        periodStart: new Date(2026, OCTOBER, 1),
        nextPeriodStart: new Date(2026, OCTOBER, 9),
        now: new Date(2026, OCTOBER, 5, 12),
        overallLimit,
        otherLimit: 0,
        categoryLimits: [],
        entries: [1, 2, 3, 4, 5].map(day => ({
            amount: 30,
            categoryId: null,
            operatedAt: new Date(2026, OCTOBER, day, 12),
            committedSource: null
        })),
        upcomingCharges: [],
        reservations: []
    });

describe('buildBudgetForecastGeometry', () => {
    it('keeps the limit on the chart when the projection is close to it', () => {
        const geometry = buildBudgetForecastGeometry({ projection: projectionWithLimit(300), ...LAYOUT });

        expect(geometry.isLimitInRange).toBe(true);
        expect(geometry.limitY).toBeGreaterThan(LAYOUT.paddingTop);
    });

    it('scales to the data and pins a far-away limit to the top edge', () => {
        const geometry = buildBudgetForecastGeometry({ projection: projectionWithLimit(5000), ...LAYOUT });
        const plotTop = Math.min(...geometry.lines.flat().map(point => point.y));

        expect(geometry.isLimitInRange).toBe(false);
        expect(geometry.limitY).toBe(LAYOUT.paddingTop);
        expect(plotTop).toBeLessThan(LAYOUT.height / 2);
    });
});
