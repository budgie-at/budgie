import { buildInzhurStatementItems } from './build-inzhur-statement-items';
import { INZHUR_ENERGY_LAYOUT, INZHUR_REIT_LAYOUT } from './inzhur-fund-layouts';
import { FIRST_DATE } from './inzhur-statement-fixtures.constant';

export const buildInzhurHoldings = (reit: number, energy: number) => [
    { layout: INZHUR_REIT_LAYOUT, quantity: reit },
    { layout: INZHUR_ENERGY_LAYOUT, quantity: energy }
];

export const buildInzhurBaselineItems = (reit: number, energy: number) =>
    buildInzhurStatementItems(FIRST_DATE, buildInzhurHoldings(reit, energy));
