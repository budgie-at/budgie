import { isDefined } from '@rnw-community/shared';

import { MARKET_CHART_PADDING_X } from '../../market-data/constant/market-chart-padding-x.constant';

import type { YieldRunningPathsInputInterface } from '../interface/yield-running-paths-input.interface';
import type { YieldRunningPathsInterface } from '../interface/yield-running-paths.interface';

const HALF_SLOT = 0.5;

const command = (letter: string, x: number, y: number) => [letter, x, ',', y].join('');

export const buildYieldRunningPaths = ({
    cumulative,
    prior,
    estimated,
    axisTop,
    width,
    height
}: YieldRunningPathsInputInterface): YieldRunningPathsInterface => {
    const slot = Math.max(width - MARKET_CHART_PADDING_X * 2, 1) / Math.max(cumulative.length, 1);
    const xOf = (index: number) => MARKET_CHART_PADDING_X + slot * (index + HALF_SLOT);
    const yOf = (value: number) => height - (value / axisTop) * height;
    const segment = (index: number) =>
        command('M', xOf(index - 1), yOf(cumulative.at(index - 1) ?? 0)) + command('L', xOf(index), yOf(cumulative.at(index) ?? 0));
    const segmentIndices = cumulative.map((_, index) => index).slice(1);
    const lastIndex = cumulative.length - 1;

    return {
        solid: segmentIndices
            .filter(index => estimated.at(index) !== true)
            .map(segment)
            .join(''),
        dashed: segmentIndices
            .filter(index => estimated.at(index) === true)
            .map(segment)
            .join(''),
        area: [
            command('M', xOf(0), height),
            ...cumulative.map((value, index) => command('L', xOf(index), yOf(value))),
            command('L', xOf(lastIndex), height),
            'Z'
        ].join(''),
        prior: isDefined(prior) ? prior.map((value, index) => command(index === 0 ? 'M' : 'L', xOf(index), yOf(value))).join('') : '',
        endX: xOf(lastIndex),
        endY: yOf(cumulative.at(-1) ?? 0),
        priorEndY: isDefined(prior) ? yOf(prior.at(-1) ?? 0) : null
    };
};
