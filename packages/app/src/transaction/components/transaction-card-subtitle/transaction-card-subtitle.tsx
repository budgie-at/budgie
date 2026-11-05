import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useTransactionSubtitleSegments } from '../../hook/use-transaction-subtitle-segments.hook';
import { isUncategorizedTransaction } from '../../utils/is-uncategorized-transaction.util';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId: number | null;
}

export const TransactionCardSubtitle = ({ transaction, accountId }: Props) => {
    const { t } = useLingui();
    const { segments, feeLabel, accountTitle, categoryLabel } = useTransactionSubtitleSegments(transaction, accountId);
    const description = [...segments, feeLabel].filter(isDefined).join(' · ');
    const subtitleTestID = [
        isUncategorizedTransaction(transaction) ? TransactionCardSelector.UncategorizedBadge : null,
        isDefined(categoryLabel) ? TransactionCardSelector.Category(categoryLabel) : null
    ].find(isDefined);

    if (!isNotEmptyString(description) && !isDefined(accountTitle) && !isDefined(transaction.receipt)) {
        return null;
    }

    return (
        <View className="flex-row items-start gap-x-xs">
            {isDefined(transaction.receipt) ? (
                <View accessible accessibilityLabel={t`Receipt`} testID={TransactionCardSelector.ReceiptMarker(transaction.id)}>
                    <Icon icon={UserIconNameEnum.Paperclip} size={12} className="text-secondary-foreground" />
                </View>
            ) : null}
            <View className="flex-1 min-w-0 gap-y-xxs">
                {isNotEmptyString(description) ? (
                    <Text
                        className="text-[13px] text-secondary-foreground"
                        numberOfLines={2}
                        ellipsizeMode="tail"
                        {...(isDefined(subtitleTestID) && { testID: subtitleTestID })}
                    >
                        {description}
                    </Text>
                ) : null}
                {isDefined(accountTitle) ? (
                    <Text className="text-[12px] text-secondary-foreground" numberOfLines={1} ellipsizeMode="middle">
                        {accountTitle}
                    </Text>
                ) : null}
            </View>
        </View>
    );
};
