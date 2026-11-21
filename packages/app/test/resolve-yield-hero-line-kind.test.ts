import { YieldGroupEnum } from '@budgie/market';
import { expect, it } from '@effect/vitest';

import { YieldHeroLineKindEnum } from '../src/yield/enum/yield-hero-line-kind.enum';
import { resolveYieldHeroLineKind } from '../src/yield/utils/resolve-yield-hero-line-kind.util';

const resting = { isScrubbing: false, group: null } as const;

it('scrubbing always shows the net after tax', () => {
    expect(resolveYieldHeroLineKind({ ...resting, isScrubbing: true })).toBe(YieldHeroLineKindEnum.SCRUB_NET);
});

it('scrubbing with an isolated group still shows the net after tax', () => {
    expect(resolveYieldHeroLineKind({ ...resting, isScrubbing: true, group: YieldGroupEnum.INTEREST })).toBe(
        YieldHeroLineKindEnum.SCRUB_NET
    );
});

it('an isolated group shows its share', () => {
    expect(resolveYieldHeroLineKind({ ...resting, group: YieldGroupEnum.DIVIDENDS })).toBe(YieldHeroLineKindEnum.SHARE);
});

it('at rest on any range it shows the net after tax with the trailing yield', () => {
    expect(resolveYieldHeroLineKind(resting)).toBe(YieldHeroLineKindEnum.RANGE_NET);
});
