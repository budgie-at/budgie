import { TransactionWithRelationsEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionCardTag = ({ transaction }: Props) => {
    const [firstTransactionTag] = transaction.transactionTags;
    const firstTag = isDefined(firstTransactionTag) ? firstTransactionTag.tag : null;

    if (!isDefined(firstTag)) {
        return null;
    }

    return (
        <View className="flex-row items-center gap-x-xs" testID={TransactionCardSelector.Tag(firstTag.title)}>
            <Icon icon={UserIconNameEnum.Tag} size={12} className="text-secondary-foreground" />
            <Text className="text-secondary-foreground text-xs" numberOfLines={1} ellipsizeMode="tail">
                {firstTag.title}
            </Text>
        </View>
    );
};
