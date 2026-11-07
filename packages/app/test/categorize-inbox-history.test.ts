import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { describe, expect, it } from '@effect/vitest';

import { CategorizeInboxFindingKindEnum } from '../src/categorize-inbox/enum/categorize-inbox-finding-kind.enum';
import { getCategorizeInboxFinding } from '../src/categorize-inbox/utils/get-categorize-inbox-finding.util';
import { getCategorizeInboxMonthlyCounts } from '../src/categorize-inbox/utils/get-categorize-inbox-monthly-counts.util';

const dates = ['2025-05-01T12:00:00Z', '2025-05-01T12:01:00Z', '2025-05-01T12:05:00Z'];

describe('categorize inbox history', () => {
    it('counts a burst as one payment day when describing weekly cadence', () => {
        const finding = getCategorizeInboxFinding({
            rows: [...dates, '2025-05-14T12:00:00Z'].map(operatedAt => ({ operatedAt: new Date(operatedAt) })),
            section: CategorizeInboxSectionEnum.REVIEW
        });
        expect(finding.kind).toBe(CategorizeInboxFindingKindEnum.PER_WEEK);
        expect(finding.rate).toBe(1);
    });
    it('does not describe a single-day burst as daily or weekly', () => {
        expect(
            getCategorizeInboxFinding({
                rows: dates.map(operatedAt => ({ operatedAt: new Date(operatedAt) })),
                section: CategorizeInboxSectionEnum.REVIEW
            }).kind
        ).toBe(CategorizeInboxFindingKindEnum.SINGLE_MONTH);
    });
    it('anchors historical buckets to the last payment and retains empty months', () => {
        const buckets = getCategorizeInboxMonthlyCounts(
            ['2025-01-01', '2025-05-14'].map(operatedAt => ({ operatedAt: new Date(operatedAt) }))
        );
        expect(buckets).toHaveLength(6);
        expect(buckets.at(-1)?.month.getMonth()).toBe(4);
        expect(buckets.at(-1)?.month.getFullYear()).toBe(2025);
        expect(buckets.map(bucket => bucket.count)).toEqual([0, 1, 0, 0, 0, 1]);
        expect(getCategorizeInboxMonthlyCounts([])).toEqual([]);
    });
});
