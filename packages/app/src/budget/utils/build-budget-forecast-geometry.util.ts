import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';

import { isDefined } from '@rnw-community/shared';

import type { BudgetForecastGeometryParamsInterface } from '../interface/budget-forecast-geometry-params.interface';
import type { BudgetForecastGeometryInterface } from '../interface/budget-forecast-geometry.interface';
import type { BudgetForecastPointInterface } from '../interface/budget-forecast-point.interface';

const VALUE_HEADROOM = 1.1;
const BILL_LABEL_OFFSET = 12;

const buildLinePath = (points: readonly BudgetForecastPointInterface[]): string =>
    points.map((point, index) => [index === 0 ? 'M' : 'L', point.x, point.y].join(' ')).join(' ');

export const buildBudgetForecastGeometry = (params: BudgetForecastGeometryParamsInterface): BudgetForecastGeometryInterface => {
    const { projection, width, height, paddingLeft, paddingRight, paddingTop, paddingBottom } = params;
    const { days, overall, upcomingCharges, elapsedDays } = projection;
    const values = days.flatMap(day => [day.actual, day.projected]).filter(isDefined);
    const maxValue = Math.max(overall.limit, ...values, 1) * VALUE_HEADROOM;
    const lastIndex = Math.max(days.length - 1, 1);
    const firstDate = days[0].date;

    const xAt = (index: number) => paddingLeft + (index / lastIndex) * (width - paddingLeft - paddingRight);
    const yAt = (value: number) => paddingTop + (1 - value / maxValue) * (height - paddingTop - paddingBottom);
    const indexOf = (date: Date) => Math.min(Math.max(differenceInCalendarDays(date, firstDate), 0), lastIndex);
    const pointsOf = (selectValue: (index: number) => number | null) =>
        days.flatMap((_, index) => {
            const value = selectValue(index);

            return isDefined(value) ? [{ x: xAt(index), y: yAt(value) }] : [];
        });

    const actualPoints = pointsOf(index => days[index].actual);
    const projectedPoints = pointsOf(index => days[index].projected);
    const lastActual = actualPoints[actualPoints.length - 1];

    return {
        actualPath: buildLinePath(actualPoints),
        todayPoint: isDefined(lastActual) ? lastActual : null,
        projectedPath: buildLinePath(projectedPoints),
        projectedEndPoint: projectedPoints[projectedPoints.length - 1] ?? null,
        limitY: yAt(overall.limit),
        todayX: xAt(Math.max(elapsedDays - 1, 0)),
        runOutX: isDefined(overall.runOutAt) ? xAt(indexOf(overall.runOutAt)) : null,
        bills: upcomingCharges.map(charge => {
            const index = indexOf(charge.date);
            const y = yAt(days[index].projected ?? overall.spent);

            return {
                key: `${charge.source.kind}-${charge.source.id}-${charge.date.getTime()}`,
                title: charge.title,
                x: xAt(index),
                y,
                labelY: y + BILL_LABEL_OFFSET
            };
        })
    };
};
