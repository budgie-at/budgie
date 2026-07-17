import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionTagPill } from '../transaction-tag-pill/transaction-tag-pill';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionInfoTagsSection = ({ transaction }: Props) => {
    if (!isNotEmptyArray(transaction.transactionTags)) {
        return null;
    }

    return (
        <View className="gap-y-xs" testID={TransactionInfoPageSelector.Row.Tags}>
            <Text className="text-sm text-secondary-foreground font-medium">
                <Trans>Tags</Trans>
            </Text>

            <View className="flex-row flex-wrap gap-sm">
                {transaction.transactionTags.map(({ tagId, tag }) => (
                    <TransactionTagPill key={tagId} title={tag.title} />
                ))}
            </View>
        </View>
    );
};
