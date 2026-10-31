import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useToday } from '../../../@generic/hook/use-today.hook';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { BudgetSelector } from '../../budget.selector';
import { computeFundTimeFraction } from '../../utils/compute-fund-time-fraction.util';
import { isFundBehind } from '../../utils/is-fund-behind.util';
import { BudgetFundRowStatus } from '../budget-fund-row-status/budget-fund-row-status';
import { BudgetLimitBar } from '../budget-limit-bar/budget-limit-bar';
import { BudgetListRow } from '../budget-list-row/budget-list-row';
import { BudgetNamedProgressRowHeader } from '../budget-named-progress-row-header/budget-named-progress-row-header';
import { BudgetRowChevron } from '../budget-row-chevron/budget-row-chevron';

import type { BudgetEntityInterface, BudgetSinkingFundEntityInterface } from '@budgie/contracts';

interface Props {
    readonly fund: BudgetSinkingFundEntityInterface;
    readonly budget: BudgetEntityInterface;
    readonly currencySymbol: string;
}

export const BudgetFundRow = ({ fund, budget, currencySymbol }: Props) => {
    const { t } = useLingui();
    const today = useToday();
    const { formatMonthAndDay } = useFormatDate();
    const barTone = isFundBehind(fund, today) ? 'warning' : 'positive';
    const dueDate = formatMonthAndDay(fund.dueAt);
    const dueLabel = t`Due ${dueDate}`;
    const { category } = useGetCategoryByIdQuery(fund.categoryId);
    const icon = isDefined(category) ? category.icon : UserIconNameEnum.PiggyBank;

    const handlePress = () => {
        router.push({ pathname: '/budget/fund', params: { id: String(fund.id) } });
    };

    return (
        <BudgetListRow icon={icon} testID={BudgetSelector.DetailsFundRow(fund.id)} onPress={handlePress}>
            <BudgetNamedProgressRowHeader
                name={fund.name}
                amount={fund.fundedAmount}
                limit={fund.targetAmount}
                currencySymbol={currencySymbol}
                trailing={<BudgetRowChevron />}
            />
            <BudgetLimitBar
                spent={fund.fundedAmount}
                limit={fund.targetAmount}
                tone={barTone}
                elapsedFraction={computeFundTimeFraction(fund, today)}
            />
            <BudgetFundRowStatus fund={fund} budget={budget} dueLabel={dueLabel} currencySymbol={currencySymbol} />
        </BudgetListRow>
    );
};
