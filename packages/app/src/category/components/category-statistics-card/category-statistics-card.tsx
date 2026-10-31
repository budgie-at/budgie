import { CategoryEntityInterface, TransactionFilterInterface, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

import { StatisticsRankingRow } from '../../../@generic/component/statistics-ranking-row/statistics-ranking-row';
import { useStatisticsCardPress } from '../../../@generic/hook/use-statistics-card-press.hook';
import { CategorizeInboxKindEnum } from '../../../categorize-inbox/enum/categorize-inbox-kind.enum';
import { StatisticsRankingAmount } from '../../../transaction/components/statistics-ranking-amount/statistics-ranking-amount';

import { CategoryStatisticsCardSelector } from './category-statistics-card.selector';

import type { ChartSwatchInterface } from '../../../@generic/interface/chart-swatch.interface';

interface Props {
    readonly category: Pick<CategoryEntityInterface, 'id' | 'icon' | 'title'>;
    readonly amount: number;
    readonly share: number;
    readonly ratio: number;
    readonly swatch: ChartSwatchInterface | null;
    readonly filters: TransactionFilterInterface;
    readonly type: TransactionTypeEnum.INCOME | TransactionTypeEnum.EXPENSE;
}

export const CategoryStatisticsCard = ({ category, amount, share, ratio, swatch, filters, type }: Props) => {
    const isCategorized = isPositiveNumber(category.id);
    const cardTestID = isCategorized ? CategoryStatisticsCardSelector.Card(category.title) : CategoryStatisticsCardSelector.Uncategorized;

    const handlePress = useStatisticsCardPress(
        filters,
        type,
        CategorizeInboxKindEnum.CATEGORY,
        isCategorized ? { categoryId: String(category.id) } : null
    );

    const icon = isCategorized ? category.icon : UserIconNameEnum.CircleDashed;

    return (
        <StatisticsRankingRow
            title={category.title}
            share={share}
            ratio={ratio}
            icon={icon}
            swatch={swatch}
            amount={
                <StatisticsRankingAmount
                    amount={amount}
                    type={type}
                    testID={CategoryStatisticsCardSelector.Amount(category.title, amount)}
                />
            }
            testID={cardTestID}
            onPress={handlePress}
        />
    );
};
