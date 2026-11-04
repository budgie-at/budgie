import '../src/@generic/utils/intl-polyfill';
import { describe, expect, it } from '@effect/vitest';
import { createIntl } from '@formatjs/intl';

import { formatRelativeToNow } from '../src/i18n/utils/format-relative-to-now.util';

const intl = createIntl({ locale: 'en' });
const now = Date.UTC(2026, 10, 2, 12);

describe('formatRelativeToNow', () => {
    it.each([
        [0, 'now'],
        [-300, 'now'],
        [30, 'now'],
        [300, '5 minutes ago'],
        [10800, '3 hours ago'],
        [345600, '4 days ago']
    ])('formats %s seconds relative to now', (seconds, expected) => {
        expect(formatRelativeToNow(new Date(now - seconds * 1000), now, intl)).toBe(expected);
    });
});
