import { expect, it } from '@effect/vitest';

import { buildYieldPayoutLabels } from '../src/yield/utils/build-yield-payout-labels.util';

it('titles a position-scoped payout with its date and subtitles it with the kind', () => {
    expect(
        buildYieldPayoutLabels({
            isMerged: false,
            isScoped: true,
            positionTitle: null,
            sourceTitle: '',
            baseTitle: 'Dividend',
            kindLabel: 'Dividend',
            dayLabel: 'Nov 1',
            fullDayLabel: 'Nov 1, 2026',
            countLabel: ''
        })
    ).toEqual({ title: 'Nov 1, 2026', subtitle: 'Dividend' });
});
