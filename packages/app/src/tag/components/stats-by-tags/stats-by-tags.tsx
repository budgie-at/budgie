import { TransactionFilterInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { CollapsibleStatsSection } from '../../../@generic/component/collapsible-stats-section/collapsible-stats-section';
import { getChartSwatches } from '../../../@generic/utils/get-chart-swatches.util';
import { getShare } from '../../../@generic/utils/get-share.util';
import { TagStatInterface } from '../../interface/tag-stat.interface';
import { TagStatisticsCard } from '../tag-statistics-card/tag-statistics-card';
import { TagStatisticsCardSelector } from '../tag-statistics-card/tag-statistics-card.selector';

interface Props {
    readonly title: string;
    readonly stats: readonly TagStatInterface[];
    readonly base: number;
    readonly filters: TransactionFilterInterface;
    readonly type: TransactionTypeEnum.INCOME | TransactionTypeEnum.EXPENSE;
}

export const StatsByTags = ({ title, stats, base, filters, type }: Props) => {
    const { t } = useLingui();

    const maxAmount = Math.max(...stats.map(stat => stat.amount), 0);
    const swatches = getChartSwatches(stats.map(stat => stat.tag?.id ?? null));

    const rows = stats.map(({ tag, amount }, index) => (
        <TagStatisticsCard
            key={tag?.id ?? 'untagged'}
            tag={tag ?? { id: null, title: t`Untagged` }}
            amount={amount}
            share={getShare(amount, base)}
            ratio={getShare(amount, maxAmount)}
            swatch={swatches[index]}
            filters={filters}
            type={type}
        />
    ));

    return (
        <CollapsibleStatsSection
            title={title}
            footnote={t`A transaction with several tags counts toward each of them, so shares can add up to more than 100%.`}
            rows={rows}
            toggleTestID={TagStatisticsCardSelector.Toggle(type)}
        />
    );
};
