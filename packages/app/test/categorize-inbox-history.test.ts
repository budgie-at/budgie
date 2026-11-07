import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { describe, expect, it } from '@effect/vitest';

import { CategorizeInboxFindingKindEnum } from '../src/categorize-inbox/enum/categorize-inbox-finding-kind.enum';
import { getCategorizeInboxFinding } from '../src/categorize-inbox/utils/get-categorize-inbox-finding.util';
import { getCategorizeInboxMonthlyCounts } from '../src/categorize-inbox/utils/get-categorize-inbox-monthly-counts.util';

const dates = [new Date(2025, 4, 1, 12), new Date(2025, 4, 1, 12, 1), new Date(2025, 4, 1, 12, 5)];

describe('categorize inbox history', () => {
    it('counts a burst as one payment day when describing weekly cadence', () => {
        const finding = getCategorizeInboxFinding({
            rows: [...dates, new Date(2025, 4, 14, 12)].map(operatedAt => ({ operatedAt })),
            section: CategorizeInboxSectionEnum.REVIEW
        });
        expect(finding.kind).toBe(CategorizeInboxFindingKindEnum.PER_WEEK);
        expect(finding.rate).toBe(1);
    });
    it('does not describe a single-day burst as daily or weekly', () => {
        expect(
            getCategorizeInboxFinding({
                rows: dates.map(operatedAt => ({ operatedAt })),
                section: CategorizeInboxSectionEnum.REVIEW
            }).kind
        ).toBe(CategorizeInboxFindingKindEnum.SINGLE_MONTH);
    });
    it('anchors historical buckets to the last payment and retains empty months', () => {
        const buckets = getCategorizeInboxMonthlyCounts(
            [new Date(2025, 0, 15, 12), new Date(2025, 4, 14, 12)].map(operatedAt => ({ operatedAt }))
        );
        expect(buckets).toHaveLength(6);
        expect(buckets.at(-1)?.month.getMonth()).toBe(4);
        expect(buckets.at(-1)?.month.getFullYear()).toBe(2025);
        expect(buckets.map(bucket => bucket.count)).toEqual([0, 1, 0, 0, 0, 1]);
        expect(getCategorizeInboxMonthlyCounts([])).toEqual([]);
    });
});
