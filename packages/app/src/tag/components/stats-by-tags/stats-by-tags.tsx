import { TransactionFilterInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { CollapsibleStatsSection } from '../../../@generic/component/collapsible-stats-section/collapsible-stats-section';
import { getChartSwatches } from '../../../@generic/utils/get-chart-swatches.util';
import { getShare } from '../../../@generic/utils/get-share.util';
import { TagStatInterface } from '../../interface/tag-stat.interface';
import { TagStatisticsCard } from '../tag-statistics-card/tag-statistics-card';
import { TagStatisticsCardSelector } from '../tag-statistics-card/tag-statistics-card.selector';

interface Props {
    readonly title: string;
    readonly footnote?: string;
    readonly stats: readonly TagStatInterface[];
    readonly base: number;
    readonly filters: TransactionFilterInterface;
    readonly type: TransactionTypeEnum.INCOME | TransactionTypeEnum.EXPENSE;
    readonly isExpanded: boolean;
    readonly onToggleExpanded: () => void;
}

export const StatsByTags = (props: Props) => {
    const { title, footnote, stats, base, filters, type, isExpanded, onToggleExpanded } = props;
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
    const untaggedIndex = stats.findIndex(stat => !isDefined(stat.tag));
    const taggedRows = rows.filter((_, index) => index !== untaggedIndex);

    return (
        <CollapsibleStatsSection
            title={title}
            footnote={footnote}
            rows={taggedRows}
            pinnedRow={rows[untaggedIndex]}
            isExpanded={isExpanded}
            toggleTestID={TagStatisticsCardSelector.Toggle(type)}
            onToggleExpanded={onToggleExpanded}
        />
    );
};
