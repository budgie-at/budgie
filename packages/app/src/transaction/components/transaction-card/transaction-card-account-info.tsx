import { TransactionWithRelationsEntityInterface, isIncomeTransaction } from '@budgie/contracts';
import { Text } from 'react-native';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionCardAccountInfo = ({ transaction }: Props) => {
    if (isIncomeTransaction(transaction)) {
        return (
            <Text className="text-xs font-medium text-primary py-xxs px-md rounded-2xl border border-secondary-corner">
                {transaction.toAccount.title}
            </Text>
        );
    }

    return null;
};
