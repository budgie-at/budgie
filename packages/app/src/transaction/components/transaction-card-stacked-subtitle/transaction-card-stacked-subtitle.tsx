import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useTransactionSubtitleSegments } from '../../hook/use-transaction-subtitle-segments.hook';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId: number | null;
}

export const TransactionCardStackedSubtitle = ({ transaction, accountId }: Props) => {
    const { segments, feeLabel, accountTitle } = useTransactionSubtitleSegments(transaction, accountId);

    return (
        <View className="gap-y-xxs">
            <Text dynamicTypeRamp="caption2" className="text-[12px] text-secondary-foreground">
                {[...segments, feeLabel].filter(isDefined).join(' · ')}
            </Text>
            {isDefined(accountTitle) ? (
                <Text dynamicTypeRamp="caption2" className="text-[12px] text-secondary-foreground">
                    {accountTitle}
                </Text>
            ) : null}
        </View>
    );
};
