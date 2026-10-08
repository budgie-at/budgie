import { TagEntityInterface, TransactionFilterInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { StatsSection } from '../../../@generic/component/stats-section/stats-section';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { TagStatisticsCard } from '../tag-statistics-card/tag-statistics-card';

interface Props {
    readonly title: string;
    readonly totalAmount: number;
    readonly variant: ColorPaletteVariant;
    readonly stats: { amount: number; tag: TagEntityInterface | null }[];
    readonly filters: TransactionFilterInterface;
    readonly isIncome: boolean;
}

export const StatsByTags = ({ title, stats, totalAmount, variant, filters, isIncome }: Props) => {
    const { t } = useLingui();

    const renderStat = ({ tag, amount }: { tag: TagEntityInterface | null; amount: number }) => {
        const tagData = tag ?? { id: null, title: t`Untagged` };

        return (
            <TagStatisticsCard
                key={tagData.id ?? 'untagged'}
                tag={tagData}
                amount={amount}
                filters={filters}
                isIncome={isIncome}
                totalAmount={totalAmount}
                variant={variant}
            />
        );
    };

    return <StatsSection title={title}>{stats.map(renderStat)}</StatsSection>;
};
