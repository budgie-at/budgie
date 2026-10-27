import { TransactionFilterInterface } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { useGetTransactionCountQuery } from '../../query/use-get-transaction-count.query';

interface Props {
    readonly filters: TransactionFilterInterface;
    readonly className?: string;
}

export const TransactionListCount = ({ filters, className }: Props) => {
    const { t } = useLingui();
    const { count: transactionCount } = useGetTransactionCountQuery(filters);

    if (!isPositiveNumber(transactionCount)) {
        return null;
    }

    return (
        <Text className={cn('text-sm text-secondary-foreground', className)} numberOfLines={1}>
            {t({ message: plural(transactionCount, { one: '# transaction', other: '# transactions' }) })}
        </Text>
    );
};
