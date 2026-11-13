import { YieldGroupEnum } from '@budgie/market';
import { expect, it } from '@effect/vitest';

import { YieldHeroLineKindEnum } from '../src/yield/enum/yield-hero-line-kind.enum';
import { resolveYieldHeroLineKind } from '../src/yield/utils/resolve-yield-hero-line-kind.util';

const resting = { isScrubbing: false, bucketTax: 0, group: null, rate: 0.042 } as const;

it('scrubbing a bucket with tax shows the net after tax', () => {
    expect(resolveYieldHeroLineKind({ ...resting, isScrubbing: true, bucketTax: 12 })).toBe(YieldHeroLineKindEnum.SCRUB_NET);
});

it('scrubbing a bucket without tax keeps the slot empty even when a group is isolated', () => {
    expect(resolveYieldHeroLineKind({ ...resting, isScrubbing: true, group: YieldGroupEnum.INTEREST })).toBe(
        YieldHeroLineKindEnum.SCRUB_EMPTY
    );
});

it('an isolated group shows its share', () => {
    expect(resolveYieldHeroLineKind({ ...resting, group: YieldGroupEnum.DIVIDENDS })).toBe(YieldHeroLineKindEnum.SHARE);
});

it('at rest it shows the annual yield when there is a rate', () => {
    expect(resolveYieldHeroLineKind(resting)).toBe(YieldHeroLineKindEnum.RATE);
});

it('at rest without a rate it shows the unavailable reason', () => {
    expect(resolveYieldHeroLineKind({ ...resting, rate: null })).toBe(YieldHeroLineKindEnum.UNAVAILABLE);
});
