import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { MARKET_CHART_PADDING_X } from '../../market-data/constant/market-chart-padding-x.constant';

import type { YieldRunningPathsInputInterface } from '../interface/yield-running-paths-input.interface';
import type { YieldRunningPathsInterface } from '../interface/yield-running-paths.interface';

const HALF_SLOT = 0.5;

const command = (letter: string, x: number, y: number) => [letter, x, y].join(' ');

export const buildYieldRunningPaths = ({
    cumulative,
    prior,
    inProgress,
    axisTop,
    axisBottom,
    width,
    height
}: YieldRunningPathsInputInterface): YieldRunningPathsInterface => {
    const slot = Math.max(width - MARKET_CHART_PADDING_X * 2, 1) / Math.max(cumulative.length, 1);
    const xOf = (index: number) => MARKET_CHART_PADDING_X + slot * (index + HALF_SLOT);
    const scale = height / (axisTop - axisBottom);
    const zeroY = axisTop * scale;
    const yOf = (value: number) => zeroY - value * scale;
    const segment = (index: number) =>
        [command('M', xOf(index - 1), yOf(cumulative.at(index - 1) ?? 0)), command('L', xOf(index), yOf(cumulative.at(index) ?? 0))].join(
            ' '
        );
    const segmentIndices = cumulative.map((_, index) => index).slice(1);
    const lastIndex = cumulative.length - 1;
    const areaIndices = cumulative.map((_, index) => index);

    return {
        solid: segmentIndices
            .filter(index => inProgress.at(index) !== true)
            .map(segment)
            .join(' '),
        dashed: segmentIndices
            .filter(index => inProgress.at(index) === true)
            .map(segment)
            .join(' '),
        area: isNotEmptyArray(areaIndices)
            ? [
                  command('M', xOf(0), zeroY),
                  ...areaIndices.map(index => command('L', xOf(index), yOf(cumulative.at(index) ?? 0))),
                  command('L', xOf(lastIndex), zeroY),
                  'Z'
              ].join(' ')
            : '',
        prior: isDefined(prior) ? prior.map((value, index) => command(index === 0 ? 'M' : 'L', xOf(index), yOf(value))).join(' ') : '',
        xs: cumulative.map((_, index) => xOf(index)),
        ys: cumulative.map(yOf),
        priorYs: isDefined(prior) ? prior.map(yOf) : [],
        endY: yOf(cumulative.at(-1) ?? 0),
        priorEndY: isDefined(prior) ? yOf(prior.at(-1) ?? 0) : null
    };
};
