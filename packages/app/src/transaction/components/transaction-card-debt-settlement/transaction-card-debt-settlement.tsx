import { DebtEventAssociationEnum } from '@budgie/contracts';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { TRANSACTION_CARD_META_TEXT_CLASS_NAME } from '../../constant/transaction-card-meta-text-class-name.constant';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { TransactionCardSeparator } from '../transaction-card-separator/transaction-card-separator';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionCardDebtSettlement = ({ transaction }: Props) => {
    const debtAccount = transaction.debtEvents.at(0)?.[DebtEventAssociationEnum.DEBT_ACCOUNT];

    if (!isDefined(debtAccount) || debtAccount.title === getTransactionDisplayTitle(transaction)) {
        return null;
    }

    return (
        <>
            <Text
                className={cn(TRANSACTION_CARD_META_TEXT_CLASS_NAME, 'shrink')}
                numberOfLines={1}
                testID={TransactionCardSelector.DebtSettlementMetadata(transaction.id)}
            >
                {debtAccount.title}
            </Text>
            <TransactionCardSeparator />
        </>
    );
};
