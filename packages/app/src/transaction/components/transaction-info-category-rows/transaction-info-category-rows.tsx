import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { getTransactionCategoryEntries } from '../../utils/get-transaction-category-entries.util';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';
import { TransactionInfoTagsRow } from '../transaction-info-tags-row/transaction-info-tags-row';

import type { TransactionInfoCategoryRowsPropsInterface } from '../../interface/transaction-info-category-rows-props.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

const getMccLabel = (transaction: TransactionWithRelationsEntityInterface): string | null => {
    const mccCategory = getTransactionCategoryEntries(transaction.entries).at(0)?.mccCategory;

    if (!isDefined(mccCategory)) {
        return null;
    }

    return `${mccCategory.mcc} · ${mccCategory.shortDescription}`;
};

export const TransactionInfoCategoryRows = ({ transaction, categoryLabel }: TransactionInfoCategoryRowsPropsInterface) => {
    const { t } = useLingui();
    const mccLabel = getMccLabel(transaction);
    const showCategory = isNotEmptyString(categoryLabel) && transaction.type !== TransactionTypeEnum.TRANSFER;

    return (
        <>
            {showCategory ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.Tags}
                    label={t`Category`}
                    value={categoryLabel}
                    testID={TransactionInfoPageSelector.Row.Category}
                />
            ) : null}

            {isNotEmptyString(mccLabel) ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.Hash}
                    label={t`Merchant code`}
                    value={mccLabel}
                    testID={TransactionInfoPageSelector.Row.MerchantCode}
                />
            ) : null}

            {isNotEmptyString(transaction.comment) ? (
                <TransactionInfoRow
                    icon={UserIconNameEnum.MessageSquare}
                    label={t`Note`}
                    value={transaction.comment}
                    testID={TransactionInfoPageSelector.Row.Note}
                />
            ) : null}

            <TransactionInfoTagsRow transaction={transaction} label={t`Tags`} testID={TransactionInfoPageSelector.Row.Tags} />
        </>
    );
};
