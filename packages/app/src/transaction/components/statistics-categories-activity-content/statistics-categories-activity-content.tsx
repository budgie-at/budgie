import { statisticsRepository } from '../../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../../@generic/hook/use-database-live-query.hook';
import { StatsByCategoriesPanel } from '../../../category/components/stats-by-categories-panel/stats-by-categories-panel';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useSetting } from '../../../settings/hook/use-setting.hook';

import type { TransactionFilterInterface } from '@budgie/contracts';

interface Props {
    readonly filters: TransactionFilterInterface;
    readonly income: number;
    readonly expense: number;
}

export const StatisticsCategoriesActivityContent = ({ filters, income, expense }: Props) => {
    const language = useSetting('language');
    const { defaultInstrument } = useSettingsContext();
    const { data: incomeByCategory } = useDatabaseLiveQuery(
        statisticsRepository.getIncomeByCategoryQuery(filters, defaultInstrument.id, language),
        [filters, defaultInstrument.id, language]
    );
    const { data: expenseByCategory } = useDatabaseLiveQuery(
        statisticsRepository.getExpenseByCategoryQuery(filters, defaultInstrument.id, language),
        [filters, defaultInstrument.id, language]
    );

    return (
        <StatsByCategoriesPanel
            filters={filters}
            income={income}
            expense={expense}
            incomeByCategory={incomeByCategory}
            expenseByCategory={expenseByCategory}
        />
    );
};
