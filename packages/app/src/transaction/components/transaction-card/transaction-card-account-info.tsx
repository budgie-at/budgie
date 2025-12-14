import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionCardAccountInfo = ({ transaction }: Props) => {
    const { toAccount } = transaction;

    if (isDefined(toAccount)) {
        return (
            <Text className="text-xs font-medium text-primary py-xxs px-md rounded-2xl border border-secondary-corner">
                {toAccount.title}
            </Text>
        );
    }

    return null;
};
