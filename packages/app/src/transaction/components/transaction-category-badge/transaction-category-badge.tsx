import {
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { resolveCategoryTitle } from '../../../category/utils/resolve-category-title.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { getTransactionEntryLabel } from '../../utils/get-transaction-entry-label.util';
import { MccCategoryChip } from '../mcc-category-chip/mcc-category-chip';
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
    const { t, i18n } = useLingui();

    const hasMultipleEntries = transaction.entries.length > 1;
    const isAdjustment = isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction);
    const unknownLabel = t`Unknown`;

    if (hasMultipleEntries) {
        return (
            <View className="flex-row flex-wrap gap-xs">
                {transaction.entries.map(entry => {
                    const resolvedCategoryTitle = resolveCategoryTitle(entry.category, i18n);
                    const entryLabel = getTransactionEntryLabel(entry, unknownLabel, resolvedCategoryTitle);
                    const entryAmount = convertFromMicroUnits(entry.amount);
                    const entryTestID = TransactionCardSelector.EntryCategoryAmount(entryLabel, entryAmount);

                    return (
                        <View className="flex-row gap-xs" key={entry.id}>
                            <View className={wrapperClassName} testID={entryTestID}>
                                <Text className={textClassName}>
                                    {entryLabel}{' '}
                                    <Text className="text-primary/70">{formatDigits(entryAmount, defaultInstrument.symbol)}</Text>
                                </Text>
                            </View>
                            {isDefined(entry.mccCategory) && isDefined(entry.category) ? (
                                <MccCategoryChip mccCategory={entry.mccCategory} />
                            ) : null}
                        </View>
                    );
                })}
            </View>
        );
    }

    const [firstEntry] = transaction.entries;
    const { mccCategory } = firstEntry;
    const showMccChip = isDefined(mccCategory) && isDefined(firstEntry.category);
    const badgeTestID = isAdjustment ? TransactionCardSelector.AdjustmentBadge : TransactionCardSelector.Category(categoryLabel);

    return (
        <View className="flex-row gap-xs">
            <View className={wrapperClassName} testID={badgeTestID}>
                <Text className={textClassName}>{categoryLabel}</Text>
            </View>
            {showMccChip && isDefined(mccCategory) ? <MccCategoryChip mccCategory={mccCategory} /> : null}
        </View>
    );
};
