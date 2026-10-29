import {
    AccountTypeEnum,
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction,
    convertFromMicroUnits
} from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { TRANSACTION_CARD_META_TEXT_CLASS_NAME } from '../../constant/transaction-card-meta-text-class-name.constant';
import { TransactionCardSeparator } from '../transaction-card-separator/transaction-card-separator';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

const CATEGORIZABLE_TYPES = new Set([TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME]);
const UNCATEGORIZED_TYPES = new Set([TransactionTypeEnum.TRANSFER, TransactionTypeEnum.DEBT]);
const labelClassName = cn(TRANSACTION_CARD_META_TEXT_CLASS_NAME, 'shrink');

export const TransactionCardCategory = ({ transaction }: Props) => {
    const formatDigits = useDisplayFormatDigits();
    const { t } = useLingui();

    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    const isAdjustment = isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction);

    if (isAdjustment || UNCATEGORIZED_TYPES.has(transaction.type)) {
        return null;
    }

    if (categoryEntries.length > 1 || isDefined(transaction.debtEvents.at(0))) {
        const hasSplit = categoryEntries.length > 1;

        return (
            <>
                {categoryEntries.map((entry, index) => {
                    const entryLabel = entry.category?.title ?? t`Unknown`;
                    const entryAmount = convertFromMicroUnits(entry.amount);
                    const entryText = hasSplit ? `${entryLabel} ${formatDigits(entryAmount, entry.account.instrument.symbol)}` : entryLabel;
                    const isLastEntry = index === categoryEntries.length - 1;

                    return (
                        <Text
                            key={entry.id}
                            className={cn(labelClassName, !isLastEntry && 'mr-xs')}
                            numberOfLines={1}
                            testID={TransactionCardSelector.EntryCategoryAmount(entryLabel, entryAmount)}
                        >
                            {isLastEntry ? entryText : `${entryText},`}
                        </Text>
                    );
                })}
                <TransactionCardSeparator />
            </>
        );
    }

    const primaryEntry = categoryEntries.at(0);
    const categoryLabel = primaryEntry?.category?.title;
    const isCategorizable =
        CATEGORIZABLE_TYPES.has(transaction.type) && isDefined(primaryEntry) && primaryEntry.account.type !== AccountTypeEnum.DEBT;

    if (!isDefined(categoryLabel) && !isCategorizable) {
        return null;
    }

    return (
        <>
            {isDefined(categoryLabel) ? (
                <Text className={labelClassName} numberOfLines={1} testID={TransactionCardSelector.Category(categoryLabel)}>
                    {categoryLabel}
                </Text>
            ) : (
                <Text
                    className="text-[13px] font-medium text-warning-foreground shrink"
                    numberOfLines={1}
                    testID={TransactionCardSelector.UncategorizedBadge}
                >
                    <Trans>Uncategorized</Trans>
                </Text>
            )}
            <TransactionCardSeparator />
        </>
    );
};
