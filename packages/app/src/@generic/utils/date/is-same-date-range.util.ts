import { DateRangeInterface } from '@budgie/contracts';

export const isSameDateRange = (rangeA: DateRangeInterface, rangeB: DateRangeInterface): boolean => {
    const fromA = rangeA.from?.getTime() ?? null;
    const fromB = rangeB.from?.getTime() ?? null;

    const toA = rangeA.to?.getTime() ?? null;
    const toB = rangeB.to?.getTime() ?? null;

    return fromA === fromB && toA === toB;
};
