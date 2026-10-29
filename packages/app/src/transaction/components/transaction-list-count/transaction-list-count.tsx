import { TransactionFilterInterface } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { TransactionsPageSelector } from '../../../app/(tabs)/transactions-page.selector';
import { useGetTransactionCountQuery } from '../../query/use-get-transaction-count.query';

interface Props {
    readonly filters: TransactionFilterInterface;
}

export const TransactionListCount = ({ filters }: Props) => {
    const { t } = useLingui();
    const { count: transactionCount } = useGetTransactionCountQuery(filters);

    if (!isPositiveNumber(transactionCount)) {
        return null;
    }

    return (
        <Text
            className="self-end pt-sm text-[13px] text-secondary-foreground"
            numberOfLines={1}
            testID={TransactionsPageSelector.TransactionCount}
        >
            {t({ message: plural(transactionCount, { one: '# transaction', other: '# transactions' }) })}
        </Text>
    );
};
