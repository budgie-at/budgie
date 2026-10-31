import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyArray } from '@rnw-community/shared';

import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionInfoTagsSection = ({ transaction }: Props) => {
    const { t } = useLingui();

    if (!isNotEmptyArray(transaction.transactionTags)) {
        return null;
    }

    return (
        <TransactionInfoRow
            icon={UserIconNameEnum.Tags}
            label={t`Tags`}
            value={transaction.transactionTags.map(({ tag }) => tag.title).join(', ')}
            testID={TransactionInfoPageSelector.Row.Tags}
        />
    );
};
