import type { HomeHoldingInterface } from '../interface/home-holding.interface';

export const isShownHomeHolding = (holding: Pick<HomeHoldingInterface, 'balance' | 'value' | 'isValued'>, decimalPlaces: number): boolean =>
    holding.balance !== 0 && (!holding.isValued || Math.round(Math.abs(holding.value) * 10 ** decimalPlaces) !== 0);
