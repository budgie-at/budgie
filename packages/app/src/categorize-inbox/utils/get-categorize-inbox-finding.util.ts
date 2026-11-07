import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { differenceInCalendarMonths } from 'date-fns/differenceInCalendarMonths';

import { CategorizeInboxFindingKindEnum } from '../enum/categorize-inbox-finding-kind.enum';

import type { CategorizeInboxFindingInputInterface } from '../interface/categorize-inbox-finding-input.interface';
import type { CategorizeInboxFindingInterface } from '../interface/categorize-inbox-finding.interface';

const DAYS_PER_WEEK = 7;
const MONTHLY_MIN_DAYS = 4;
const RATE_MIN_DAYS = 2;

const getKind = (paymentDays: number, perDay: number, distinctMonths: number, spanMonths: number): CategorizeInboxFindingKindEnum => {
    if (paymentDays >= MONTHLY_MIN_DAYS && distinctMonths === paymentDays && spanMonths === paymentDays) {
        return CategorizeInboxFindingKindEnum.ONCE_A_MONTH;
    }

    if (paymentDays >= RATE_MIN_DAYS && perDay >= 1) {
        return CategorizeInboxFindingKindEnum.PER_DAY;
    }

    if (paymentDays >= RATE_MIN_DAYS && perDay * DAYS_PER_WEEK >= 1) {
        return CategorizeInboxFindingKindEnum.PER_WEEK;
    }

    return spanMonths >= 2 ? CategorizeInboxFindingKindEnum.MONTH_RANGE : CategorizeInboxFindingKindEnum.SINGLE_MONTH;
};

export const getCategorizeInboxFinding = ({ rows, section }: CategorizeInboxFindingInputInterface): CategorizeInboxFindingInterface => {
    const times = rows.map(row => row.operatedAt.getTime());
    const firstAt = new Date(Math.min(...times));
    const lastAt = new Date(Math.max(...times));
    const distinctDays = new Set(rows.map(row => row.operatedAt.toDateString())).size;
    const perDay = distinctDays / (differenceInCalendarDays(lastAt, firstAt) + 1);
    const distinctMonths = new Set(rows.map(row => `${row.operatedAt.getFullYear()}-${row.operatedAt.getMonth()}`)).size;
    const spanMonths = differenceInCalendarMonths(lastAt, firstAt) + 1;
    const kind =
        section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS
            ? CategorizeInboxFindingKindEnum.CASH
            : getKind(distinctDays, perDay, distinctMonths, spanMonths);
    const rate = kind === CategorizeInboxFindingKindEnum.PER_DAY ? Math.round(perDay) : Math.round(perDay * DAYS_PER_WEEK);

    return { kind, rate, firstAt, lastAt };
};
