import { TransactionTypeEnum, UserIconNameEnum, UserIconType } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { isTransactionNoteDuplicated } from '../../utils/is-transaction-note-duplicated.util';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

const getMccLabel = (transaction: TransactionWithRelationsEntityInterface): string | null => {
    const mccCategory = getTransactionCategoryEntries(transaction.entries).at(0)?.mccCategory;

    if (!isDefined(mccCategory)) {
        return null;
    }

    return `${mccCategory.mcc} · ${mccCategory.shortDescription}`;
};

const getCategoryIcon = (transaction: TransactionWithRelationsEntityInterface): UserIconType => {
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);

    if (categoryEntries.length > 1) {
        return UserIconNameEnum.Split;
    }

    const icon = categoryEntries.at(0)?.category?.icon;

    return isDefined(icon) ? icon : UserIconNameEnum.Shapes;
};

export const TransactionInfoCategoryRows = ({ transaction }: Props) => {
    const { t } = useLingui();
    const categoryLabel = getTransactionCategoryEntries(transaction.entries).at(0)?.category?.title ?? null;
    const mccLabel = getMccLabel(transaction);
    const isNoteDuplicated = isTransactionNoteDuplicated(transaction);
    const showCategory = isNotEmptyString(categoryLabel) && transaction.type !== TransactionTypeEnum.TRANSFER;
    const showMcc = isNotEmptyString(mccLabel);
    const showNote = isNotEmptyString(transaction.comment) && !isNoteDuplicated;

    return (
        <>
            {showCategory ? (
                <TransactionInfoRow
                    icon={getCategoryIcon(transaction)}
                    label={t`Category`}
                    value={categoryLabel}
                    testID={TransactionInfoPageSelector.Row.Category}
                />
            ) : null}

            {showMcc ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.Hash}
                    label={t`Merchant code`}
                    value={mccLabel}
                    testID={TransactionInfoPageSelector.Row.MerchantCode}
                />
            ) : null}

            {showNote ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.MessageSquare}
                    label={t`Note`}
                    value={transaction.comment}
                    testID={TransactionInfoPageSelector.Row.Note}
                />
            ) : null}
        </>
    );
};
