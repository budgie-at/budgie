import {
    TagEntityInterface,
    TransactionTagsAssociationEnum,
    TransactionTagsEntityInterface,
    TransactionWithRelationsEntityInterface,
    UserIconNameEnum
} from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly testID?: string;
}

type TransactionTagWithTag = TransactionTagsEntityInterface & {
    [TransactionTagsAssociationEnum.TAG]: TagEntityInterface;
};

export const TransactionCardTag = ({ transaction, testID }: Props) => {
    const firstTransactionTag = transaction.transactionTags[0] as TransactionTagWithTag | undefined;
    const firstTag = isDefined(firstTransactionTag) ? firstTransactionTag.tag : null;

    if (!isDefined(firstTag)) {
        return null;
    }

    return (
        <View testID={testID} className="flex-row items-center gap-x-xs">
            <Icon icon={UserIconNameEnum.Tag} size={12} className="text-secondary-foreground" />
            <Text className="text-secondary-foreground text-xs" numberOfLines={1} ellipsizeMode="tail">
                {firstTag.title}
            </Text>
        </View>
    );
};
