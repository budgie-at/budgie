import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { differenceInCalendarMonths } from 'date-fns/differenceInCalendarMonths';

import { CategorizeInboxFindingKindEnum } from '../enum/categorize-inbox-finding-kind.enum';

import type { CategorizeInboxFindingInterface } from '../interface/categorize-inbox-finding.interface';
import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

const DAYS_PER_WEEK = 7;
const MONTHLY_MIN_COUNT = 4;
const RATE_MIN_COUNT = 2;

const getKind = (count: number, perDay: number, distinctMonths: number, spanMonths: number): CategorizeInboxFindingKindEnum => {
    if (count >= MONTHLY_MIN_COUNT && distinctMonths === count && spanMonths === count) {
        return CategorizeInboxFindingKindEnum.ONCE_A_MONTH;
    }

    if (count >= RATE_MIN_COUNT && perDay >= 1) {
        return CategorizeInboxFindingKindEnum.PER_DAY;
    }

    if (count >= RATE_MIN_COUNT && perDay * DAYS_PER_WEEK >= 1) {
        return CategorizeInboxFindingKindEnum.PER_WEEK;
    }

    return spanMonths >= 2 ? CategorizeInboxFindingKindEnum.MONTH_RANGE : CategorizeInboxFindingKindEnum.SINGLE_MONTH;
};

export const getCategorizeInboxFinding = ({
    rows,
    section
}: Pick<CategorizeInboxClusterInterface, 'rows' | 'section'>): CategorizeInboxFindingInterface => {
    const times = rows.map(row => row.operatedAt.getTime());
    const firstAt = new Date(Math.min(...times));
    const lastAt = new Date(Math.max(...times));
    const perDay = rows.length / (differenceInCalendarDays(lastAt, firstAt) + 1);
    const distinctMonths = new Set(rows.map(row => `${row.operatedAt.getFullYear()}-${row.operatedAt.getMonth()}`)).size;
    const spanMonths = differenceInCalendarMonths(lastAt, firstAt) + 1;
    const kind =
        section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS
            ? CategorizeInboxFindingKindEnum.CASH
            : getKind(rows.length, perDay, distinctMonths, spanMonths);
    const rate = kind === CategorizeInboxFindingKindEnum.PER_DAY ? Math.round(perDay) : Math.round(perDay * DAYS_PER_WEEK);

    return { kind, rate, firstAt, lastAt };
};
