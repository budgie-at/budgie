import { expect, it } from '@effect/vitest';

import { getMarketChartBin } from '../src/market-data/utils/get-market-chart-bin.util';

const WIDTH = 112;
const COUNT = 4;

it('maps the left padding to the first bin', () => {
    expect(getMarketChartBin(6, WIDTH, COUNT)).toBe(0);
});

it('clamps the right padding edge to the last bin', () => {
    expect(getMarketChartBin(WIDTH - 6, WIDTH, COUNT)).toBe(3);
});

it('clamps x past either edge', () => {
    expect(getMarketChartBin(500, WIDTH, COUNT)).toBe(3);
    expect(getMarketChartBin(-50, WIDTH, COUNT)).toBe(0);
});

it('maps interior x to the bin that contains it', () => {
    expect(getMarketChartBin(30.9, WIDTH, COUNT)).toBe(0);
    expect(getMarketChartBin(31, WIDTH, COUNT)).toBe(1);
    expect(getMarketChartBin(81, WIDTH, COUNT)).toBe(3);
});

it('returns the only bin for a count of one and 0 for degenerate input', () => {
    expect(getMarketChartBin(60, WIDTH, 1)).toBe(0);
    expect(getMarketChartBin(60, WIDTH, 0)).toBe(0);
    expect(getMarketChartBin(60, 10, COUNT)).toBe(0);
});
