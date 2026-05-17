import {
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { getTransactionEntryLabel } from '../../utils/get-transaction-entry-label.util';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly categoryLabel: string;
}

const wrapperClassName = 'rounded-sm py-xxs px-sm bg-primary/10 border border-secondary-corner';
const textClassName = 'text-secondary-foreground text-xxs font-medium';

export const TransactionCategoryBadge = ({ transaction, categoryLabel }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const { t } = useLingui();

    const hasMultipleEntries = transaction.entries.length > 1;
    const isAdjustment = isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction);
    const unknownLabel = t`Unknown`;

    if (hasMultipleEntries) {
        return (
            <View className="flex-row flex-wrap gap-xs">
                {transaction.entries.map(entry => {
                    const entryLabel = getTransactionEntryLabel(entry, unknownLabel);
                    const entryAmount = convertFromMicroUnits(entry.amount);
                    const entryTestID = TransactionCardSelector.EntryCategoryAmount(entryLabel, entryAmount);

                    return (
                        <View className={wrapperClassName} testID={entryTestID} key={entry.id}>
                            <Text className={textClassName}>
                                {entryLabel} <Text className="text-primary/70">{formatDigits(entryAmount, defaultInstrument.symbol)}</Text>
                            </Text>
                        </View>
                    );
                })}
            </View>
        );
    }

    const badgeTestID = isAdjustment ? TransactionCardSelector.AdjustmentBadge : TransactionCardSelector.Category(categoryLabel);

    return (
        <View className={wrapperClassName} testID={badgeTestID}>
            <Text className={textClassName}>{categoryLabel}</Text>
        </View>
    );
};
