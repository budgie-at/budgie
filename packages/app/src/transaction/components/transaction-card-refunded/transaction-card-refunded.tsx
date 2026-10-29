import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { TRANSACTION_CARD_META_TEXT_CLASS_NAME } from '../../constant/transaction-card-meta-text-class-name.constant';
import { useRefundedLabel } from '../../hook/use-refunded-label.hook';
import { TransactionCardSeparator } from '../transaction-card-separator/transaction-card-separator';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionCardRefunded = ({ transaction }: Props) => {
    const label = useRefundedLabel(transaction);

    if (!isDefined(label)) {
        return null;
    }

    return (
        <>
            <View className="flex-row items-center gap-x-xxs shrink-0" testID={TransactionCardSelector.RefundedPill(transaction.id)}>
                <Icon icon={UserIconNameEnum.RotateCcw} size={12} className="text-secondary-foreground" />
                <Text className={cn(TRANSACTION_CARD_META_TEXT_CLASS_NAME)} numberOfLines={1}>
                    {label}
                </Text>
            </View>
            <TransactionCardSeparator />
        </>
    );
};
