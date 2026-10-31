import { TransactionFilterInterface, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { CollapsibleStatsSection } from '../../../@generic/component/collapsible-stats-section/collapsible-stats-section';
import { getChartSwatches } from '../../../@generic/utils/get-chart-swatches.util';
import { getShare } from '../../../@generic/utils/get-share.util';
import { CategoryStatInterface } from '../../interface/category-stat.interface';
import { CategoryStatisticsCard } from '../category-statistics-card/category-statistics-card';
import { CategoryStatisticsCardSelector } from '../category-statistics-card/category-statistics-card.selector';

interface Props {
    readonly title: string;
    readonly stats: readonly CategoryStatInterface[];
    readonly filters: TransactionFilterInterface;
    readonly type: TransactionTypeEnum.INCOME | TransactionTypeEnum.EXPENSE;
}

export const StatsByCategories = ({ title, stats, filters, type }: Props) => {
    const { t } = useLingui();

    const totalAmount = stats.reduce((sum, stat) => sum + stat.amount, 0);
    const maxAmount = Math.max(...stats.map(stat => stat.amount), 0);
    const swatches = getChartSwatches(stats.map(stat => stat.category?.id ?? null));

    const rows = stats.map(({ category, amount }, index) => (
        <CategoryStatisticsCard
            key={category?.id ?? 'uncategorized'}
            category={category ?? { id: 0, icon: UserIconNameEnum.CircleDashed, title: t`Uncategorized` }}
            amount={amount}
            share={getShare(amount, totalAmount)}
            ratio={getShare(amount, maxAmount)}
            swatch={swatches[index]}
            filters={filters}
            type={type}
        />
    ));

    return <CollapsibleStatsSection title={title} rows={rows} toggleTestID={CategoryStatisticsCardSelector.Toggle(type)} />;
};
