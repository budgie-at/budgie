import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { describe, expect, it } from '@effect/vitest';

import { CategorizeInboxFindingKindEnum } from '../src/categorize-inbox/enum/categorize-inbox-finding-kind.enum';
import { getCategorizeInboxFinding } from '../src/categorize-inbox/utils/get-categorize-inbox-finding.util';
import { getCategorizeInboxMonthlyCounts } from '../src/categorize-inbox/utils/get-categorize-inbox-monthly-counts.util';

const historyRows = (dates: Date[]) => dates.map(operatedAt => ({ operatedAt }));

const dates = [new Date(2025, 4, 1, 12), new Date(2025, 4, 1, 12, 1), new Date(2025, 4, 1, 12, 5)];

describe('categorize inbox history', () => {
    it('does not inflate cadence from a burst followed thirteen days later', () => {
        const finding = getCategorizeInboxFinding({
            rows: historyRows([...dates, new Date(2025, 4, 14, 12)]),
            section: CategorizeInboxSectionEnum.REVIEW
        });
        expect(finding.kind).toBe(CategorizeInboxFindingKindEnum.SINGLE_MONTH);
    });
    it('does not describe a single-day burst as daily or weekly', () => {
        expect(
            getCategorizeInboxFinding({
                rows: historyRows(dates),
                section: CategorizeInboxSectionEnum.REVIEW
            }).kind
        ).toBe(CategorizeInboxFindingKindEnum.SINGLE_MONTH);
    });
    it('describes payments seven calendar days apart as weekly', () => {
        const finding = getCategorizeInboxFinding({
            rows: historyRows([new Date(2025, 2, 7, 12), new Date(2025, 2, 14, 12)]),
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
    it('describes consecutive local days as daily with no rate', () => {
        const finding = getCategorizeInboxFinding({
            rows: historyRows([new Date(2025, 2, 8, 12), new Date(2025, 2, 9, 12), new Date(2025, 2, 10, 12)]),
            section: CategorizeInboxSectionEnum.REVIEW
        });
        expect(finding.kind).toBe(CategorizeInboxFindingKindEnum.PER_DAY);
        expect(finding.rate).toBe(0);
    });
    it('counts calendar days across daylight saving despite a short elapsed interval', () => {
        const finding = getCategorizeInboxFinding({
            rows: historyRows([new Date(2025, 2, 8, 23, 30), new Date(2025, 2, 10, 0, 30)]),
            section: CategorizeInboxSectionEnum.REVIEW
        });
        expect(finding.kind).toBe(CategorizeInboxFindingKindEnum.PER_WEEK);
        expect(finding.rate).toBe(4);
    });
    it('describes three payment days in nine days as twice weekly', () => {
        const finding = getCategorizeInboxFinding({
            rows: historyRows([1, 5, 9].map(day => new Date(2025, 2, day, 12))),
            section: CategorizeInboxSectionEnum.REVIEW
        });
        expect(finding.kind).toBe(CategorizeInboxFindingKindEnum.PER_WEEK);
        expect(finding.rate).toBe(2);
    });
    it.each([15, 28])('describes all but one of %s payment days as daily', days => {
        const finding = getCategorizeInboxFinding({
            rows: historyRows(
                Array.from({ length: days }, (_, index) => new Date(2025, 2, index + 1, 12)).filter(date => date.getDate() !== 7)
            ),
            section: CategorizeInboxSectionEnum.REVIEW
        });
        expect(finding.kind).toBe(CategorizeInboxFindingKindEnum.PER_DAY);
        expect(finding.rate).toBe(0);
    });
    it('describes four monthly payment days despite a same-day duplicate', () => {
        expect(
            getCategorizeInboxFinding({
                rows: historyRows([
                    new Date(2025, 0, 7, 12),
                    new Date(2025, 1, 7, 12),
                    new Date(2025, 2, 7, 12),
                    new Date(2025, 3, 7, 12),
                    new Date(2025, 3, 7, 13)
                ]),
                section: CategorizeInboxSectionEnum.REVIEW
            }).kind
        ).toBe(CategorizeInboxFindingKindEnum.ONCE_A_MONTH);
    });
    it('anchors historical buckets to the last payment and retains empty months', () => {
        const buckets = getCategorizeInboxMonthlyCounts(historyRows([new Date(2025, 0, 15, 12), new Date(2025, 4, 14, 12)]));
        expect(buckets).toHaveLength(6);
        expect(buckets.at(-1)?.month.getMonth()).toBe(4);
        expect(buckets.at(-1)?.month.getFullYear()).toBe(2025);
        expect(buckets.map(bucket => bucket.count)).toEqual([0, 1, 0, 0, 0, 1]);
        expect(getCategorizeInboxMonthlyCounts([])).toEqual([]);
    });
});
