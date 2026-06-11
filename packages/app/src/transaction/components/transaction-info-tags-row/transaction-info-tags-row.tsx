import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { TransactionCardTagChip } from '../transaction-card-tag-chip/transaction-card-tag-chip';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { TransactionInfoTagsRowPropsInterface } from '../../interface/transaction-info-tags-row-props.interface';

export const TransactionInfoTagsRow = ({ transaction, label, testID }: TransactionInfoTagsRowPropsInterface) => {
    if (!isNotEmptyArray(transaction.transactionTags)) {
        return null;
    }

    const value = transaction.transactionTags.map(({ tag }) => tag.title).join(', ');
    const isPrimary = transaction.transactionTags.length > 1;

    return (
        <View>
            <TransactionInfoRow icon={UserIconNameEnum.Tags} label={label} value={value} testID={testID} />
            <View className="flex-row flex-wrap gap-xs -mt-3xl ml-[60px] pb-xl">
                {transaction.transactionTags.map(({ tagId, tag }) => (
                    <TransactionCardTagChip key={tagId} title={tag.title} isPrimary={isPrimary} />
                ))}
            </View>
        </View>
    );
};
