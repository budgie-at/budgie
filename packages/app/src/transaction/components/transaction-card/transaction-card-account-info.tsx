import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { Text } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionCardAccountInfo = ({ transaction }: Props) => {
    const { toAccount, fromAccount } = transaction;

    const accountTitle = toAccount?.title ?? fromAccount?.title;

    if (isNotEmptyString(accountTitle)) {
        return (
            <Text className="text-xs font-medium text-primary py-xxs px-md rounded-2xl border border-secondary-corner">{accountTitle}</Text>
        );
    }

    return null;
};
