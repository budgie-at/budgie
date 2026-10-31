import { BudgetLimitSourceEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { EntranceReveal } from '../../../@generic/component/entrance-reveal/entrance-reveal';
import { HairlineStatRow } from '../../../@generic/component/hairline-stat-row/hairline-stat-row';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { BudgetSelector } from '../../budget.selector';
import { BUDGET_PACE_TEXT_CLASS_NAME } from '../../constant/budget-pace-text-class-name.constant';
import { isBudgetTight } from '../../utils/is-budget-tight.util';
import { BudgetHeldBackNote } from '../budget-held-back-note/budget-held-back-note';

import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly limitSource: BudgetLimitSourceEnum;
    readonly currencySymbol: string;
}

export const BudgetStatRow = ({ projection, limitSource, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const scope = projection.overall;
    const leftTone = scope.free < 0 ? 'destructive' : 'positive';
    const isNeutralLeft = scope.free >= 0 && isBudgetTight(projection, limitSource);

    const formatAmount = (amount: number) => formatDigits(convertFromMicroUnits(amount), currencySymbol).replace('-', '−');

    const spentStat = {
        label: t`Spent`,
        value: formatAmount(scope.spent),
        variant: 'primary',
        testID: BudgetSelector.DetailsSpentLabel
    } as const;
    const leftStat = {
        label: t`Left`,
        value: formatAmount(scope.free),
        variant: isNeutralLeft ? 'primary' : leftTone,
        ...(!isNeutralLeft && { valueClassName: BUDGET_PACE_TEXT_CLASS_NAME[leftTone] }),
        testID: BudgetSelector.DetailsRemainingLabel
    } as const;
    const limitValue = formatAmount(scope.limit);
    const incomeLabel = limitSource === BudgetLimitSourceEnum.INCOME_EXPECTED ? t`Expected income` : t`Income`;
    const incomeStat = { label: incomeLabel, value: limitValue, variant: 'primary', testID: BudgetSelector.DetailsLimitLabel } as const;
    const limitStat = { label: t`Limit`, value: limitValue, variant: 'primary', testID: BudgetSelector.DetailsLimitLabel } as const;
    const stats =
        limitSource === BudgetLimitSourceEnum.FIXED
            ? ([spentStat, leftStat, limitStat] as const)
            : ([incomeStat, spentStat, leftStat] as const);

    return (
        <EntranceReveal step={2} className="gap-y-xs">
            <HairlineStatRow stats={stats} />
            <BudgetHeldBackNote scope={scope} currencySymbol={currencySymbol} />
        </EntranceReveal>
    );
};
