import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { TRANSACTION_SECONDARY_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/transaction-secondary-max-font-size-multiplier.constant';
import { TransactionReceiptMarker } from '../transaction-receipt-marker/transaction-receipt-marker';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly segments: readonly string[];
    readonly accountTitle: string | null;
    readonly testID?: string;
}

export const TransactionCardStackedSubtitle = ({ transaction, segments, accountTitle, testID }: Props) => {
    if (!isNotEmptyArray(segments) && !isDefined(accountTitle) && !isDefined(transaction.receipt)) {
        return null;
    }

    return (
        <View className="gap-y-xxs">
            {isDefined(transaction.receipt) ? <TransactionReceiptMarker transactionId={transaction.id} /> : null}
            {isNotEmptyArray(segments) ? (
                <Text
                    accessibilityLabel={segments.join(', ')}
                    {...(isDefined(testID) && { testID })}
                    dynamicTypeRamp="footnote"
                    maxFontSizeMultiplier={TRANSACTION_SECONDARY_MAX_FONT_SIZE_MULTIPLIER}
                    className="text-[12px] text-secondary-foreground"
                >
                    {segments.join(' · ')}
                </Text>
            ) : null}
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
