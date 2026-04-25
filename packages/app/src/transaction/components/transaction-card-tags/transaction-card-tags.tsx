import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { derivePrimaryTagView } from '../../utils/derive-primary-tag-view.util';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';
import { TransactionCardTagChip } from '../transaction-card-tag-chip/transaction-card-tag-chip';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionCardTags = ({ transaction }: Props) => {
    const { primaryTag, hasMultipleTags, siblingsCount } = derivePrimaryTagView(transaction.transactionTags);

    if (!isDefined(primaryTag)) {
        return null;
    }

    return (
        <View className="flex-row items-center gap-x-xs" testID={TransactionCardSelector.Tag(primaryTag.title)}>
            <TransactionCardTagChip title={primaryTag.title} isPrimary={hasMultipleTags} />
            {hasMultipleTags ? (
                <View className="rounded-full border border-secondary-corner px-sm py-[2px]">
                    <Text className="text-xs text-secondary-foreground">{`+${siblingsCount}`}</Text>
                </View>
            ) : null}
        </View>
    );
};
