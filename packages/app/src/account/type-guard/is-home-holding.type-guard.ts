import type { HomeHoldingInterface } from '../interface/home-holding.interface';

export const isHomeHolding = (item: object): item is HomeHoldingInterface => 'weight' in item;
