import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { describe, expect, it } from '@effect/vitest';

import { CategorizeInboxFindingKindEnum } from '../src/categorize-inbox/enum/categorize-inbox-finding-kind.enum';
import { getCategorizeInboxFinding } from '../src/categorize-inbox/utils/get-categorize-inbox-finding.util';
import { getCategorizeInboxMonthlyCounts } from '../src/categorize-inbox/utils/get-categorize-inbox-monthly-counts.util';

const dates = [new Date(2025, 4, 1, 12), new Date(2025, 4, 1, 12, 1), new Date(2025, 4, 1, 12, 5)];

describe('categorize inbox history', () => {
    it('does not inflate cadence from a burst followed thirteen days later', () => {
        const finding = getCategorizeInboxFinding({
            rows: [...dates, new Date(2025, 4, 14, 12)].map(operatedAt => ({ operatedAt })),
            section: CategorizeInboxSectionEnum.REVIEW
        });
        expect(finding.kind).toBe(CategorizeInboxFindingKindEnum.SINGLE_MONTH);
    });
    it('does not describe a single-day burst as daily or weekly', () => {
        expect(
            getCategorizeInboxFinding({
                rows: dates.map(operatedAt => ({ operatedAt })),
                section: CategorizeInboxSectionEnum.REVIEW
            }).kind
        ).toBe(CategorizeInboxFindingKindEnum.SINGLE_MONTH);
    });
    it('describes payments seven calendar days apart as weekly', () => {
        const finding = getCategorizeInboxFinding({
            rows: [new Date(2025, 2, 7, 12), new Date(2025, 2, 14, 12)].map(operatedAt => ({ operatedAt })),
            section: CategorizeInboxSectionEnum.REVIEW
        });
        expect(finding.kind).toBe(CategorizeInboxFindingKindEnum.PER_WEEK);
        expect(finding.rate).toBe(1);
    });
    it('describes payments on days one, four and seven as twice weekly', () => {
        const finding = getCategorizeInboxFinding({
            rows: [1, 4, 7].map(day => ({ operatedAt: new Date(2025, 2, day, 12) })),
            section: CategorizeInboxSectionEnum.REVIEW
        });
        expect(finding.kind).toBe(CategorizeInboxFindingKindEnum.PER_WEEK);
        expect(finding.rate).toBe(2);
    });
    it('describes consecutive local days across daylight saving as daily', () => {
        expect(
            getCategorizeInboxFinding({
                rows: [new Date(2025, 2, 8, 12), new Date(2025, 2, 9, 12), new Date(2025, 2, 10, 12)].map(operatedAt => ({ operatedAt })),
                section: CategorizeInboxSectionEnum.REVIEW
            }).kind
        ).toBe(CategorizeInboxFindingKindEnum.PER_DAY);
    });
    it('describes four monthly payment days despite a same-day duplicate', () => {
        expect(
            getCategorizeInboxFinding({
                rows: [
                    new Date(2025, 0, 7, 12),
                    new Date(2025, 1, 7, 12),
                    new Date(2025, 2, 7, 12),
                    new Date(2025, 3, 7, 12),
                    new Date(2025, 3, 7, 13)
                ].map(operatedAt => ({ operatedAt })),
                section: CategorizeInboxSectionEnum.REVIEW
            }).kind
        ).toBe(CategorizeInboxFindingKindEnum.ONCE_A_MONTH);
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
