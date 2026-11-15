import { TransactionTypeEnum } from '@budgie/contracts';
import { router } from 'expo-router';
import { View } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { TransactionCard } from '../../../transaction/components/transaction-card/transaction-card';
import { getTransactionHref } from '../../../transaction/utils/get-transaction-href.util';
import { YIELD_SOURCE_FOCUS } from '../../constant/yield-source-focus.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly isUnassigned: boolean;
}

export const YieldPayoutRow = ({ transaction, isUnassigned }: Props) => {
    const handlePress = (pressed: TransactionWithRelationsEntityInterface) => {
        if (isUnassigned && pressed.type === TransactionTypeEnum.INCOME) {
            router.push({ pathname: '/transactions/[id]/income', params: { id: String(pressed.id), focus: YIELD_SOURCE_FOCUS } });

            return;
        }

        router.push(getTransactionHref(pressed));
    };

    return (
        <View testID={PassiveIncomeSelector.Payout(transaction.id)}>
            <TransactionCard transaction={transaction} onPress={handlePress} onLongPress={emptyFn} />
        </View>
    );
};
