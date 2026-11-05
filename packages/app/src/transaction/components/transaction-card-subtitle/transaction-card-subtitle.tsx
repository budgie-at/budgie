import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { ListRowDetail } from '../../../@generic/component/list-row-detail/list-row-detail';
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

    const detailSegments = [...segments.flatMap(segment => segment.split(' · ')), feeLabel, accountTitle].filter(isNotEmptyString);
    const hasReceipt = isDefined(transaction.receipt);

    if (!isNotEmptyArray(detailSegments) && !hasReceipt) {
        return null;
    }

    const subtitleTestID = [
        isUncategorizedTransaction(transaction) ? TransactionCardSelector.UncategorizedBadge : null,
        isDefined(categoryLabel) ? TransactionCardSelector.Category(categoryLabel) : null
    ].find(isDefined);

    return (
        <View className="flex-row items-start">
            {hasReceipt ? (
                <View
                    className="mt-[3px] mr-xs"
                    accessible
                    accessibilityLabel={t`Receipt`}
                    testID={TransactionCardSelector.ReceiptMarker(transaction.id)}
                >
                    <Icon icon={UserIconNameEnum.Paperclip} size={12} className="text-secondary-foreground" />
                </View>
            ) : null}
            <View className="min-w-0 flex-1">
                <ListRowDetail segments={detailSegments} {...(isDefined(subtitleTestID) && { testID: subtitleTestID })} />
            </View>
        </View>
    );
};
