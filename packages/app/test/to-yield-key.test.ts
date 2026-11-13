import { YieldGroupEnum, YieldRangeEnum } from '@budgie/market';
import { expect, it } from '@effect/vitest';

import { toYieldKey } from '../src/yield/utils/to-yield-key.util';

it('parses every param into a primitive key with the scope id', () => {
    expect(
        toYieldKey({ range: 'MONTH', position: '12', group: 'INTEREST', focus: '2026-03-01', from: 'account-12' }, YieldRangeEnum.YEAR, 1)
    ).toEqual({
        key: {
            range: YieldRangeEnum.MONTH,
            positionAccountId: 12,
            instrumentId: null,
            group: YieldGroupEnum.INTEREST,
            baseInstrumentId: 1
        },
        focusDay: '2026-03-01',
        from: 'account-12',
        scopeId: 'account-12',
        period: null
    });
    expect(toYieldKey({ instrument: '35' }, YieldRangeEnum.QUARTER, 2)).toMatchObject({
        key: { range: YieldRangeEnum.QUARTER, positionAccountId: null, instrumentId: 35 },
        scopeId: 'instrument-35'
    });
});

it('falls back to unfiltered for unknown, malformed or non-selectable params', () => {
    expect(
        toYieldKey({ range: 'WEEK', position: 'abc', instrument: '-3', group: 'TAX', focus: '13/03/2026' }, YieldRangeEnum.ALL, 1)
    ).toEqual({
        key: { range: YieldRangeEnum.ALL, positionAccountId: null, instrumentId: null, group: null, baseInstrumentId: 1 },
        focusDay: null,
        from: null,
        scopeId: null,
        period: null
    });
});

it('keeps an Analytics period only when both days are valid', () => {
    expect(toYieldKey({ periodFrom: '2026-10-03', periodTo: '2026-10-20' }, YieldRangeEnum.YEAR, 1).period).toEqual({
        fromDay: '2026-10-03',
        toDay: '2026-10-20'
    });
    expect(toYieldKey({ periodFrom: '2026-10-03' }, YieldRangeEnum.YEAR, 1).period).toBeNull();
});
