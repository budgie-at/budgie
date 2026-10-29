import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { derivePrimaryTagView } from '../../utils/derive-primary-tag-view.util';
import { TransactionCardSeparator } from '../transaction-card-separator/transaction-card-separator';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionCardTags = ({ transaction }: Props) => {
    const { primaryTag, hasMultipleTags, siblingsCount } = derivePrimaryTagView(transaction.transactionTags);

    if (!isDefined(primaryTag)) {
        return null;
    }

    return (
        <>
            <TransactionCardSeparator />
            <View className="flex-1 flex-row items-center min-w-[56px]">
                <Text
                    className="text-[13px] text-secondary-foreground/70 shrink"
                    numberOfLines={1}
                    testID={TransactionCardSelector.Tag(primaryTag.title)}
                >
                    {`#${primaryTag.title}`}
                </Text>
                {hasMultipleTags ? (
                    <Text
                        className="text-[13px] text-secondary-foreground/70 ml-xs shrink-0"
                        testID={TransactionCardSelector.TagSiblingsCount(primaryTag.title)}
                    >{`+${siblingsCount}`}</Text>
                ) : null}
            </View>
        </>
    );
};
