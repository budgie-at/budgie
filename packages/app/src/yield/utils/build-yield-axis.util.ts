import type { YieldAxisInterface } from '../interface/yield-axis.interface';

const NICE_STEPS = [1, 2, 2.5, 5, 10] as const;
const DECIMAL_BASE = 10;
const GRIDLINE_SPANS = 2;
const EMPTY_AXIS: YieldAxisInterface = { step: 1, top: 1, bottom: 0, gridlines: [0, 1] };

export const buildYieldAxis = (maxValue: number, minValue: number): YieldAxisInterface => {
    if (!Number.isFinite(maxValue) || !Number.isFinite(minValue)) {
        return EMPTY_AXIS;
    }

    const top = Math.max(maxValue, 0);
    const bottom = Math.min(minValue, 0);
    const rawStep = (top - bottom) / GRIDLINE_SPANS;

    if (rawStep <= 0) {
        return EMPTY_AXIS;
    }

    const magnitude = DECIMAL_BASE ** Math.floor(Math.log10(rawStep));
    const step = (NICE_STEPS.find(nice => nice >= rawStep / magnitude) ?? DECIMAL_BASE) * magnitude;
    const topSteps = Math.ceil(top / step);
    const bottomSteps = Math.floor(bottom / step);

    return {
        step,
        top: topSteps * step,
        bottom: bottomSteps * step,
        gridlines: Array.from({ length: topSteps - bottomSteps + 1 }, (_, index) => (bottomSteps + index) * step)
    };
};
