import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { TRANSACTION_SECONDARY_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/transaction-secondary-max-font-size-multiplier.constant';
import { useTransactionCardSubtitle } from '../../hook/use-transaction-card-subtitle.hook';
import { TransactionReceiptMarker } from '../transaction-receipt-marker/transaction-receipt-marker';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId: number | null;
}

export const TransactionCardStackedSubtitle = ({ transaction, accountId }: Props) => {
    const { description, accessibilityLabel, accountTitle, subtitleTestID } = useTransactionCardSubtitle(transaction, accountId);

    return (
        <View className="gap-y-xxs">
            {isDefined(transaction.receipt) ? <TransactionReceiptMarker transactionId={transaction.id} /> : null}
            <Text
                accessibilityLabel={accessibilityLabel}
                {...(isDefined(subtitleTestID) && { testID: subtitleTestID })}
                dynamicTypeRamp="footnote"
                maxFontSizeMultiplier={TRANSACTION_SECONDARY_MAX_FONT_SIZE_MULTIPLIER}
                className="text-[12px] text-secondary-foreground"
            >
                {description}
            </Text>
            {isDefined(accountTitle) ? (
                <Text
                    dynamicTypeRamp="footnote"
                    maxFontSizeMultiplier={TRANSACTION_SECONDARY_MAX_FONT_SIZE_MULTIPLIER}
                    className="text-[12px] text-secondary-foreground"
                >
                    {accountTitle}
                </Text>
            ) : null}
        </View>
    );
};
