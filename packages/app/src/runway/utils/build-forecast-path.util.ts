import { RUNWAY_MAX_MONTHS } from '@budgie/contracts';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { RUNWAY_FORECAST_HORIZONS_MONTHS } from '../constant/runway-forecast.constant';

import type { BuildRunwayForecastPathParamsInterface } from '../interface/build-runway-forecast-path-params.interface';
import type { RunwayForecastGeometryInterface } from '../interface/runway-forecast-geometry.interface';
import type { RunwayForecastPointInterface } from '../interface/runway-forecast-point.interface';

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
    const medianValues = RUNWAY_FORECAST_HORIZONS_MONTHS.map(months => liquid + net * months);
    const p25Values = RUNWAY_FORECAST_HORIZONS_MONTHS.map(months => liquid + p25Net * months);
    const p75Values = RUNWAY_FORECAST_HORIZONS_MONTHS.map(months => liquid + p75Net * months);
    const scaledValues = [...medianValues, ...p25Values, ...p75Values, ZERO_VALUE];
    const minValue = Math.min(...scaledValues);
    const maxValue = Math.max(...scaledValues);
    const valueRange = maxValue - minValue;

    const xAt = (months: number) => paddingLeft + (months / RUNWAY_MAX_MONTHS) * drawableWidth;
    const yAt = (value: number) =>
        isPositiveNumber(valueRange)
            ? paddingTop + (1 - (value - minValue) / valueRange) * drawableHeight
            : paddingTop + drawableHeight / 2;
    const xTicks = RUNWAY_FORECAST_HORIZONS_MONTHS.map(months => xAt(months));
    const medianPoints = medianValues.map((value, index) => ({ x: xTicks[index], y: yAt(value) }));
    const p25Points = p25Values.map((value, index) => ({ x: xTicks[index], y: yAt(value) }));
    const p75Points = p75Values.map((value, index) => ({ x: xTicks[index], y: yAt(value) }));
    const bandPoints = [...p75Points, ...[...p25Points].reverse()];
    const runOutX = isDefined(runwayMonths) ? xAt(Math.min(Math.max(runwayMonths, ZERO_VALUE), RUNWAY_MAX_MONTHS)) : null;
    const runOutY = isDefined(runOutX) ? yAt(ZERO_VALUE) : null;

    return {
        medianPath: buildForecastPath(medianPoints, false),
        bandPath: buildForecastPath(bandPoints, true),
        zeroY: yAt(ZERO_VALUE),
        runOutX,
        runOutY,
        tickXs: xTicks
    };
};
