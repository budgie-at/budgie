import { computeBudgetProjection } from '@budgie/budget';
import { describe, expect, it } from '@effect/vitest';

import { buildBudgetForecastGeometry } from '../src/budget/utils/build-budget-forecast-geometry.util';
import { resolveBudgetForecastDomain } from '../src/budget/utils/resolve-budget-forecast-domain.util';

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
        const projection = projectionWithLimit(300);
        const geometry = buildBudgetForecastGeometry({ projection, ...LAYOUT });

        expect(resolveBudgetForecastDomain(projection)).toEqual({ maxValue: 315, isLimitInRange: true });
        expect(geometry.limitY).toBeGreaterThan(LAYOUT.paddingTop);
    });

    it('scales to the data and pins a far-away limit to the top edge', () => {
        const projection = projectionWithLimit(5000);
        const geometry = buildBudgetForecastGeometry({ projection, ...LAYOUT });
        const plotTop = Math.min(...geometry.lines.flat().map(point => point.y));
        const domain = resolveBudgetForecastDomain(projection);

        expect(domain.isLimitInRange).toBe(false);
        expect(domain.maxValue).toBeLessThan(5000 / 2);
        expect(geometry.limitY).toBe(LAYOUT.paddingTop);
        expect(plotTop).toBeLessThan(LAYOUT.height / 2);
    });
});
