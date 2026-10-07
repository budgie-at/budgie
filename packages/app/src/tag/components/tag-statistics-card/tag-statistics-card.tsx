import { TagEntityInterface, TransactionFilterInterface } from '@budgie/contracts';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { StatisticsCard } from '../../../@generic/component/statistics-card/statistics-card';
import { useStatisticsCardPress } from '../../../@generic/hook/use-statistics-card-press.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { AnalyticsTransactionsModeEnum } from '../../../transaction/enum/analytics-transactions-mode.enum';

import { TagStatisticsCardSelector } from './tag-statistics-card.selector';

interface Props {
    readonly tag: Pick<TagEntityInterface, 'title'> & { id: TagEntityInterface['id'] | null };
    readonly amount: number;
    readonly totalAmount: number;
    readonly variant: ColorPaletteVariant;
    readonly filters: TransactionFilterInterface;
    readonly isIncome: boolean;
}

export const TagStatisticsCard = ({ tag, amount, totalAmount, variant, filters, isIncome }: Props) => {
    const isTagged = isDefined(tag.id);
    const cardTestID = isTagged ? TagStatisticsCardSelector.Card(tag.title) : TagStatisticsCardSelector.Untagged;

    const handlePress = useStatisticsCardPress(
        filters,
        isIncome,
        AnalyticsTransactionsModeEnum.TAG_INBOX,
        isTagged ? { tagId: String(tag.id) } : null
    );

    return (
        <StatisticsCard
            amount={amount}
            totalAmount={totalAmount}
            variant={variant}
            isIncome={isIncome}
            cardTestID={cardTestID}
            amountTestID={TagStatisticsCardSelector.Amount(tag.title, amount)}
            onPress={handlePress}
        >
            <Text className="mr-auto text-primary text-xs">{tag.title}</Text>
        </StatisticsCard>
    );
};
