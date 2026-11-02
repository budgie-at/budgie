import { percentile } from './percentile.util';

const MEDIAN_RANK = 0.5;
const MAD_TO_STANDARD_DEVIATION = 1.4826;
const SPIKE_FENCE_WIDTH = 3;

export const spikeExcess = (values: readonly number[]): number[] => {
    const median = percentile(values, MEDIAN_RANK);
    const medianAbsoluteDeviation = percentile(
        values.map(value => Math.abs(value - median)),
        MEDIAN_RANK
    );
    const fence = median + SPIKE_FENCE_WIDTH * Math.max(MAD_TO_STANDARD_DEVIATION * medianAbsoluteDeviation, median);

    return values.map(value => Math.max(value - fence, 0));
};
