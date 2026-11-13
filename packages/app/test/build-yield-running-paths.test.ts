import { expect, it } from '@effect/vitest';

import { buildYieldRunningPaths } from '../src/yield/utils/build-yield-running-paths.util';

const points = (path: string) => [...path.matchAll(/(-?[\d.]+),(-?[\d.]+)/gu)].map(match => [Number(match[1]), Number(match[2])]);

it('draws estimated buckets dashed, the rest solid, and the prior path by bucket index', () => {
    const paths = buildYieldRunningPaths({
        cumulative: [0, 50, 100],
        prior: [0, 40, 80],
        estimated: [false, false, true],
        axisTop: 100,
        width: 112,
        height: 100
    });

    expect(points(paths.solid).map(([, y]) => y)).toEqual([100, 50]);
    expect(points(paths.dashed).map(([, y]) => y)).toEqual([50, 0]);
    expect(points(paths.prior).map(([, y]) => y)).toEqual([100, 60, 20]);
    expect(points(paths.dashed).at(0)?.at(0)).toBeCloseTo(56, 6);
    expect(paths.area.endsWith('Z')).toBe(true);
    expect([paths.endY, paths.priorEndY]).toEqual([0, 20]);
    expect(paths.endX).toBeCloseTo(89.333, 2);
});

it('leaves the prior path empty without a prior series', () => {
    const paths = buildYieldRunningPaths({
        cumulative: [0, 10],
        prior: null,
        estimated: [false, false],
        axisTop: 10,
        width: 112,
        height: 100
    });

    expect(paths.prior).toBe('');
    expect(paths.priorEndY).toBeNull();
    expect(paths.dashed).toBe('');
});
