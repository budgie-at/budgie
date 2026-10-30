import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { TransactionTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { CategorizeInboxFindingKindEnum } from '../enum/categorize-inbox-finding-kind.enum';

import { getCategorizeInboxJarName } from './get-categorize-inbox-jar-name.util';

import type { CategorizeInboxFindingInterface } from '../interface/categorize-inbox-finding.interface';
import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

const DAY_MS = 86_400_000;
const DAYS_PER_WEEK = 7;
const MONTHLY_TOLERANCE = 1;
const MONTHLY_MIN_COUNT = 3;

export const getCategorizeInboxFinding = (
    { displayTitle, rows, section }: CategorizeInboxClusterInterface,
    accountTitle: string | null
): CategorizeInboxFindingInterface => {
    const jarName = getCategorizeInboxJarName(displayTitle);
    const count = rows.length;
    const times = rows.map(row => row.operatedAt.getTime());
    const spanDays = Math.max(1, (Math.max(...times) - Math.min(...times)) / DAY_MS);
    const perDay = count / spanDays;
    const isPerDay = perDay >= 1;
    const rate = isPerDay ? Math.round(perDay) : Math.max(1, Math.round(perDay * DAYS_PER_WEEK));
    const distinctMonths = new Set(rows.map(row => `${row.operatedAt.getFullYear()}-${row.operatedAt.getMonth()}`)).size;
    const isMonthly =
        count >= MONTHLY_MIN_COUNT && distinctMonths >= MONTHLY_MIN_COUNT && Math.abs(count - distinctMonths) <= MONTHLY_TOLERANCE;
    const isExpense = rows.at(0)?.type === TransactionTypeEnum.EXPENSE;
    const base = { rate, isPerDay };

    if (section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS) {
        return { ...base, kind: CategorizeInboxFindingKindEnum.CASH };
    }

    if (isDefined(jarName) || isDefined(accountTitle)) {
        return { ...base, kind: isExpense ? CategorizeInboxFindingKindEnum.JAR_TOP_UP : CategorizeInboxFindingKindEnum.JAR_RETURN };
    }

    return { ...base, kind: isMonthly ? CategorizeInboxFindingKindEnum.MONTHLY : CategorizeInboxFindingKindEnum.GENERIC };
};
