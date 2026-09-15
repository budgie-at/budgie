import { RUNWAY_MAX_MONTHS } from '@budgie/contracts';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { RUNWAY_HORIZON_MONTHS } from '../constant/runway-horizon-months.constant';

import type { RunwayComputationInterface } from '../interface/runway-computation.interface';

interface RunwayForecastPointInterface {
    readonly x: number;
    readonly y: number;
}

interface RunwayForecastGeometryInterface {
    readonly medianPath: string;
    readonly bandPath: string;
    readonly zeroY: number;
    readonly runOutX: number | null;
    readonly tickXs: readonly number[];
}

interface BuildRunwayForecastPathParamsInterface {
    readonly computation: RunwayComputationInterface;
    readonly width: number;
    readonly height: number;
    readonly paddingLeft: number;
    readonly paddingRight: number;
    readonly paddingTop: number;
    readonly paddingBottom: number;
}

const ZERO_VALUE = 0;

const buildForecastPath = (points: readonly RunwayForecastPointInterface[], close: boolean): string => {
    const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');

    return close ? `${path} Z` : path;
};

export const buildRunwayForecastPath = (params: BuildRunwayForecastPathParamsInterface): RunwayForecastGeometryInterface => {
    const { computation, width, height, paddingLeft, paddingRight, paddingTop, paddingBottom } = params;
    const { liquid, net, p25Net, p75Net, runwayMonths } = computation;

    const drawableWidth = width - paddingLeft - paddingRight;
    const drawableHeight = height - paddingTop - paddingBottom;
    const medianValues = RUNWAY_HORIZON_MONTHS.map(months => liquid + net * months);
    const p25Values = RUNWAY_HORIZON_MONTHS.map(months => liquid + p25Net * months);
    const p75Values = RUNWAY_HORIZON_MONTHS.map(months => liquid + p75Net * months);
    const minValue = Math.min(...medianValues, ...p25Values, ...p75Values, ZERO_VALUE);
    const maxValue = Math.max(...medianValues, ...p25Values, ...p75Values, ZERO_VALUE);
    const valueRange = maxValue - minValue;

    const xAt = (months: number) => paddingLeft + (months / RUNWAY_MAX_MONTHS) * drawableWidth;
    const yAt = (value: number) =>
        isPositiveNumber(valueRange)
            ? paddingTop + (1 - (value - minValue) / valueRange) * drawableHeight
            : paddingTop + drawableHeight / 2;
    const xTicks = RUNWAY_HORIZON_MONTHS.map(months => xAt(months));
    const p25Points = p25Values.map((value, index) => ({ x: xTicks[index], y: yAt(value) }));
    const p75Points = p75Values.map((value, index) => ({ x: xTicks[index], y: yAt(value) }));

    return {
        medianPath: buildForecastPath(
            medianValues.map((value, index) => ({ x: xTicks[index], y: yAt(value) })),
            false
        ),
        bandPath: buildForecastPath([...p75Points, ...[...p25Points].reverse()], true),
        zeroY: yAt(ZERO_VALUE),
        runOutX: isDefined(runwayMonths) && runwayMonths <= RUNWAY_MAX_MONTHS ? xAt(Math.max(runwayMonths, ZERO_VALUE)) : null,
        tickXs: xTicks
    };
};
