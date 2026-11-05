import { Text } from 'react-native';

import { joinWithMiddot } from '../../../@generic/utils/join-with-middot.util';
import { useTransactionSubtitleSegments } from '../../hook/use-transaction-subtitle-segments.hook';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId: number | null;
}

export const TransactionCardStackedSubtitle = ({ transaction, accountId }: Props) => {
    const { segments, feeLabel, accountTitle } = useTransactionSubtitleSegments(transaction, accountId);

    return (
        <Text className="text-[13px] text-secondary-foreground" numberOfLines={4}>
            {joinWithMiddot([...segments, feeLabel, accountTitle])}
        </Text>
    );
};
