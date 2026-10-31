import { TagEntityInterface, TransactionFilterInterface, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { StatisticsRankingRow } from '../../../@generic/component/statistics-ranking-row/statistics-ranking-row';
import { useStatisticsCardPress } from '../../../@generic/hook/use-statistics-card-press.hook';
import { CategorizeInboxKindEnum } from '../../../categorize-inbox/enum/categorize-inbox-kind.enum';
import { StatisticsRankingAmount } from '../../../transaction/components/statistics-ranking-amount/statistics-ranking-amount';

import { TagStatisticsCardSelector } from './tag-statistics-card.selector';

import type { ChartSwatchInterface } from '../../../@generic/interface/chart-swatch.interface';

interface Props {
    readonly tag: Pick<TagEntityInterface, 'title'> & { readonly id: TagEntityInterface['id'] | null };
    readonly amount: number;
    readonly share: number;
    readonly ratio: number;
    readonly swatch: ChartSwatchInterface | null;
    readonly filters: TransactionFilterInterface;
    readonly type: TransactionTypeEnum.INCOME | TransactionTypeEnum.EXPENSE;
}

export const TagStatisticsCard = ({ tag, amount, share, ratio, swatch, filters, type }: Props) => {
    const isTagged = isDefined(tag.id);
    const cardTestID = isTagged ? TagStatisticsCardSelector.Card(tag.title) : TagStatisticsCardSelector.Untagged;

    const handlePress = useStatisticsCardPress(filters, type, CategorizeInboxKindEnum.TAG, isTagged ? { tagId: String(tag.id) } : null);

    const icon = isTagged ? UserIconNameEnum.Tag : UserIconNameEnum.CircleDashed;

    return (
        <StatisticsRankingRow
            title={tag.title}
            share={share}
            ratio={ratio}
            icon={icon}
            swatch={swatch}
            amount={<StatisticsRankingAmount amount={amount} type={type} testID={TagStatisticsCardSelector.Amount(tag.title, amount)} />}
            testID={cardTestID}
            onPress={handlePress}
        />
    );
};
