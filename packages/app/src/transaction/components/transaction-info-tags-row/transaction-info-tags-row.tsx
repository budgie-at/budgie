import { UserIconNameEnum } from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

import { TransactionCardTagChip } from '../transaction-card-tag-chip/transaction-card-tag-chip';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { TransactionInfoTagsRowPropsInterface } from '../../interface/transaction-info-tags-row-props.interface';

export const TransactionInfoTagsRow = ({ transaction, label, testID, withBottomBorder }: TransactionInfoTagsRowPropsInterface) => {
    if (!isNotEmptyArray(transaction.transactionTags)) {
        return null;
    }

    const isPrimary = transaction.transactionTags.length > 1;

    return (
        <TransactionInfoRow icon={UserIconNameEnum.Tags} label={label} testID={testID} withBottomBorder={withBottomBorder}>
            {transaction.transactionTags.map(({ tagId, tag }) => (
                <TransactionCardTagChip key={tagId} title={tag.title} isPrimary={isPrimary} />
            ))}
        </TransactionInfoRow>
    );
};
