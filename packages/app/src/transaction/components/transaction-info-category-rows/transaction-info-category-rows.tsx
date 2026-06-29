import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { getTransactionCategoryEntries } from '../../utils/get-transaction-category-entries.util';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';
import { TransactionInfoTagsRow } from '../transaction-info-tags-row/transaction-info-tags-row';

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

export const TransactionInfoCategoryRows = ({ transaction, categoryLabel, hasFollowingRows }: Props) => {
    const { t } = useLingui();
    const mccLabel = getMccLabel(transaction);
    const showCategory = isNotEmptyString(categoryLabel) && transaction.type !== TransactionTypeEnum.TRANSFER;
    const showMcc = isNotEmptyString(mccLabel);
    const showNote = isNotEmptyString(transaction.comment);
    const showTags = isNotEmptyArray(transaction.transactionTags);
    const categoryWithBottomBorder = showMcc || showNote || showTags || hasFollowingRows;
    const mccWithBottomBorder = showNote || showTags || hasFollowingRows;
    const noteWithBottomBorder = showTags || hasFollowingRows;

    return (
        <>
            {showCategory ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.Tags}
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
                    withBottomBorder={noteWithBottomBorder}
                />
            ) : null}

            <TransactionInfoTagsRow
                transaction={transaction}
                label={t`Tags`}
                testID={TransactionInfoPageSelector.Row.Tags}
                withBottomBorder={hasFollowingRows}
            />
        </>
    );
};
