import { TransactionFilterInterface } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { TransactionsPageSelector } from '../../../app/(tabs)/transactions-page.selector';
import { useGetTransactionCountQuery } from '../../query/use-get-transaction-count.query';

import type { ReactNode } from 'react';

interface Props {
    readonly filters: TransactionFilterInterface;
    readonly children: ReactNode;
}

export const TransactionListCount = ({ filters, children }: Props) => {
    const { t } = useLingui();
    const { count: transactionCount } = useGetTransactionCountQuery(filters);

    const countLabelProps = isPositiveNumber(transactionCount)
        ? { accessibilityLabel: t({ message: plural(transactionCount, { one: '# transaction', other: '# transactions' }) }) }
        : {};

    return (
        <View className="flex-1" collapsable={false} testID={TransactionsPageSelector.TransactionCount} {...countLabelProps}>
            {children}
        </View>
    );
};
