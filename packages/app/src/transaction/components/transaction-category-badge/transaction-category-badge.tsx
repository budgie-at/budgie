import {
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction,
    convertFromMicroUnits
} from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

const wrapperClassName = 'self-start rounded-sm py-xxs px-sm bg-primary/10 border border-secondary-corner';
const textClassName = 'text-secondary-foreground text-xxs font-medium';

export const TransactionCategoryBadge = ({ transaction }: Props) => {
    const formatDigits = useDisplayFormatDigits();
    const { t } = useLingui();

    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    const shouldShowEntryAmounts = categoryEntries.length > 1 || isDefined(transaction.debtEvents.at(0));
    const isAdjustment = isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction);

    if (shouldShowEntryAmounts) {
        return (
            <View className="flex-row flex-wrap gap-xs">
                {categoryEntries.map(entry => {
                    const entryLabel = entry.category?.title ?? t`Unknown`;
                    const entryAmount = convertFromMicroUnits(entry.amount);
                    const entryTestID = TransactionCardSelector.EntryCategoryAmount(entryLabel, entryAmount);

                    return (
                        <View className={wrapperClassName} testID={entryTestID} key={entry.id}>
                            <Text className={textClassName}>
                                {entryLabel}{' '}
                                <Text className="text-primary/70">{formatDigits(entryAmount, entry.account.instrument.symbol)}</Text>
                            </Text>
                        </View>
                    );
                })}
            </View>
        );
    }

    if (isAdjustment) {
        return (
            <View className={wrapperClassName} testID={TransactionCardSelector.AdjustmentBadge}>
                <Text className={textClassName}>
                    <Trans>Balance Adjustment</Trans>
                </Text>
            </View>
        );
    }

    const categoryLabel = categoryEntries.at(0)?.category?.title;

    if (!isDefined(categoryLabel)) {
        return null;
    }

    return (
        <View className={wrapperClassName} testID={TransactionCardSelector.Category(categoryLabel)}>
            <Text className={textClassName}>{categoryLabel}</Text>
        </View>
    );
};
