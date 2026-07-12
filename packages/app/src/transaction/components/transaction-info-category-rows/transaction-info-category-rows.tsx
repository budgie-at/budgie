import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { getTransactionCategoryEntries } from '../../utils/get-transaction-category-entries.util';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly categoryLabel: string | null;
    readonly hasFollowingRows: boolean;
}

const getMccLabel = (transaction: TransactionWithRelationsEntityInterface): string | null => {
    const mccCategory = getTransactionCategoryEntries(transaction.entries).at(0)?.mccCategory;

    if (!isDefined(mccCategory)) {
        return null;
    }

    return `${mccCategory.mcc} · ${mccCategory.shortDescription}`;
};

const getCategoryIcon = (transaction: TransactionWithRelationsEntityInterface): UserIconNameEnum => {
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);

    if (categoryEntries.length > 1) {
        return UserIconNameEnum.Split;
    }

    return categoryEntries.at(0)?.category?.icon ?? UserIconNameEnum.Shapes;
};

export const TransactionInfoCategoryRows = ({ transaction, categoryLabel, hasFollowingRows }: Props) => {
    const { t } = useLingui();
    const mccLabel = getMccLabel(transaction);
    const displayedTitle = getTransactionDisplayTitle(transaction);
    const isNoteDuplicated = isNotEmptyString(transaction.comment) && transaction.comment === displayedTitle;
    const showCategory = isNotEmptyString(categoryLabel) && transaction.type !== TransactionTypeEnum.TRANSFER;
    const showMcc = isNotEmptyString(mccLabel);
    const showNote = isNotEmptyString(transaction.comment) && !isNoteDuplicated;
    const categoryWithBottomBorder = showMcc || showNote || hasFollowingRows;
    const mccWithBottomBorder = showNote || hasFollowingRows;

    return (
        <>
            {showCategory ? (
                <TransactionInfoRow
                    icon={getCategoryIcon(transaction)}
                    label={t`Category`}
                    value={categoryLabel}
                    testID={TransactionInfoPageSelector.Row.Category}
                    withBottomBorder={categoryWithBottomBorder}
                />
            ) : null}

            {showMcc ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.Hash}
                    label={t`Merchant code`}
                    value={mccLabel}
                    testID={TransactionInfoPageSelector.Row.MerchantCode}
                    withBottomBorder={mccWithBottomBorder}
                />
            ) : null}

            {showNote ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.MessageSquare}
                    label={t`Note`}
                    value={transaction.comment}
                    testID={TransactionInfoPageSelector.Row.Note}
                    withBottomBorder={hasFollowingRows}
                />
            ) : null}
        </>
    );
};
