import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { getTransactionMccLabel } from '../../utils/get-transaction-mcc-label.util';
import { isUncategorizedTransaction } from '../../utils/is-uncategorized-transaction.util';
import { TransactionInfoDebtRows } from '../transaction-info-debt-rows/transaction-info-debt-rows';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';
import { TransactionInfoSplitEntryRow } from '../transaction-info-split-entry-row/transaction-info-split-entry-row';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionInfoCategoryRows = ({ transaction }: Props) => {
    const { t } = useLingui();
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    const category = categoryEntries.at(0)?.category;
    const isTransfer = transaction.type === TransactionTypeEnum.TRANSFER;
    const isSplit = !isTransfer && categoryEntries.length > 1;
    const isUncategorized = !isSplit && isUncategorizedTransaction(transaction);
    const singleCategory = !isTransfer && !isSplit && isDefined(category) ? category : null;
    const mccLabel = getTransactionMccLabel(transaction);

    return (
        <>
            {isDefined(singleCategory) ? (
                <TransactionInfoRow
                    icon={singleCategory.icon}
                    label={t`Category`}
                    value={singleCategory.title}
                    testID={TransactionInfoPageSelector.Row.Category}
                />
            ) : null}

            {isUncategorized ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.CircleDashed}
                    label={t`Category`}
                    value={t`Uncategorized`}
                    valueClassName="text-attention-foreground"
                    testID={TransactionInfoPageSelector.Row.Category}
                />
            ) : null}

            {isSplit ? (
                <View testID={TransactionInfoPageSelector.Row.Category}>
                    {categoryEntries.map((entry, index) => (
                        <TransactionInfoSplitEntryRow
                            key={entry.id}
                            entry={entry}
                            testID={TransactionInfoPageSelector.Row.SplitEntry(index)}
                        />
                    ))}
                </View>
            ) : null}

            <TransactionInfoDebtRows transaction={transaction} />

            {isNotEmptyString(mccLabel) ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.Hash}
                    label={t`Merchant code`}
                    value={mccLabel}
                    testID={TransactionInfoPageSelector.Row.MerchantCode}
                />
            ) : null}
        </>
    );
};
