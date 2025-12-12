import { DateFilterInterface } from '@budgie/contracts';

export const isSameDateRange = (rangeA: DateFilterInterface, rangeB: DateFilterInterface): boolean => {
    const fromA = rangeA.from?.getTime() ?? null;
    const fromB = rangeB.from?.getTime() ?? null;

    const toA = rangeA.to?.getTime() ?? null;
    const toB = rangeB.to?.getTime() ?? null;

    return fromA === fromB && toA === toB;
};
