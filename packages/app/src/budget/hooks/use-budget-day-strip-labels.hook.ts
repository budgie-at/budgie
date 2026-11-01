import { BudgetPaceStatusEnum } from '@budgie/budget';
import { BudgetPeriodEnum, convertFromMicroUnits } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { useProtectedWholeAmountLabel } from '../../@generic/hook/use-protected-whole-amount-label.hook';
import { BudgetDayStateEnum } from '../enum/budget-day-state.enum';
import { buildBudgetDayStripCells } from '../utils/build-budget-day-strip-cells.util';

import type { BudgetProjectionInterface } from '@budgie/budget';

const DAYS_PER_WEEK = 7;

export const useBudgetDayStripLabels = (
    projection: BudgetProjectionInterface,
    period: BudgetPeriodEnum,
    currencySymbol: string,
    isTight: boolean
) => {
    const { t } = useLingui();
    const formatWholeAmount = useProtectedWholeAmountLabel();
    const { elapsedDays, totalDays, dailyAllowance, overall } = projection;
    const dayCells = buildBudgetDayStripCells(projection, period);
    const isYearly = period === BudgetPeriodEnum.YEARLY;
    const overDays = dayCells.filter(
        ({ dayState }) => dayState === BudgetDayStateEnum.OVER || dayState === BudgetDayStateEnum.FAR_OVER
    ).length;
    const currentWeek = Math.ceil(elapsedDays / DAYS_PER_WEEK);
    const totalWeeks = dayCells.length;
    const allowanceLabel = formatWholeAmount(
        convertFromMicroUnits(isYearly ? dailyAllowance * DAYS_PER_WEEK : dailyAllowance),
        currencySymbol
    );
    const overLabel = isYearly
        ? t({ message: plural(overDays, { one: '# week over your weekly allowance', other: '# weeks over your weekly allowance' }) })
        : t({ message: plural(overDays, { one: '# day over your daily allowance', other: '# days over your daily allowance' }) });
    const safeLabel = formatWholeAmount(convertFromMicroUnits(overall.safePerDay), currencySymbol);
    const comfortableCaption =
        overall.safePerDay > dailyAllowance
            ? t`Plan ${allowanceLabel}/day · You can spend up to ${safeLabel}/day`
            : t`Plan ${allowanceLabel}/day · ${safeLabel}/day keeps you on track`;
    const safeCaption = isTight ? t`Plan ${allowanceLabel}/day · Stay under ${safeLabel}/day` : comfortableCaption;
    const dailyCaption = overall.status === BudgetPaceStatusEnum.OVER ? t`Plan ${allowanceLabel}/day` : safeCaption;

    return {
        dayCells,
        accessibilityLabel: isYearly
            ? t`Week ${currentWeek} of ${totalWeeks}. ${overLabel}.`
            : t`Day ${elapsedDays} of ${totalDays}. ${overLabel}.`,
        captionLabel: isYearly ? t`Each week against your ${allowanceLabel} weekly allowance` : dailyCaption
    };
};
