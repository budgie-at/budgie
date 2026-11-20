import type { YieldQueryKeyInterface } from '@budgie/market';

export const isYieldQueryKeyEqual = (left: YieldQueryKeyInterface, right: YieldQueryKeyInterface) =>
    left.range === right.range &&
    left.positionAccountId === right.positionAccountId &&
    left.instrumentId === right.instrumentId &&
    left.group === right.group &&
    left.baseInstrumentId === right.baseInstrumentId;
