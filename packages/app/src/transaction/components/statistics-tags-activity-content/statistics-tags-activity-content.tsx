import { statisticsRepository } from '../../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../../@generic/hook/use-database-live-query.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { StatsByTagsPanel } from '../../../tag/components/stats-by-tags-panel/stats-by-tags-panel';

import type { TransactionFilterInterface } from '@budgie/contracts';

interface Props {
    readonly filters: TransactionFilterInterface;
    readonly income: number;
    readonly expense: number;
}

export const StatisticsTagsActivityContent = ({ filters, income, expense }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const { data: incomeByTag } = useDatabaseLiveQuery(statisticsRepository.getIncomeByTagQuery(filters, defaultInstrument.id), [
        filters,
        defaultInstrument.id
    ]);
    const { data: expenseByTag } = useDatabaseLiveQuery(statisticsRepository.getExpenseByTagQuery(filters, defaultInstrument.id), [
        filters,
        defaultInstrument.id
    ]);

    return <StatsByTagsPanel filters={filters} income={income} expense={expense} incomeByTag={incomeByTag} expenseByTag={expenseByTag} />;
};
