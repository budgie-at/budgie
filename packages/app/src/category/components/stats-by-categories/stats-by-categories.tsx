import { TransactionFilterInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { StatsSection } from '../../../@generic/component/stats-section/stats-section';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { CategoryStatInterface } from '../../interface/category-stat.interface';
import { CategoryStatisticsCard } from '../category-statistics-card/category-statistics-card';

interface Props {
    readonly title: string;
    readonly totalAmount: number;
    readonly variant: ColorPaletteVariant;
    readonly stats: CategoryStatInterface[];
    readonly filters: TransactionFilterInterface;
    readonly isIncome: boolean;
}

export const StatsByCategories = ({ title, stats, totalAmount, variant, filters, isIncome }: Props) => {
    const { t } = useLingui();

    const renderStat = ({ category, amount }: CategoryStatInterface) => {
        const categoryData = category ?? {
            id: 0,
            icon: UserIconNameEnum.BadgeQuestionMark,
            title: t`Uncategorized`,
            isDefault: false
        };

        return (
            <CategoryStatisticsCard
                key={category?.id ?? 'uncategorized'}
                category={categoryData}
                amount={amount}
                totalAmount={totalAmount}
                variant={variant}
                filters={filters}
                isIncome={isIncome}
            />
        );
    };

    return <StatsSection title={title}>{stats.map(renderStat)}</StatsSection>;
};
