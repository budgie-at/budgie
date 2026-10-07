import { isExpenseTransaction } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { Redirect } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { getTransactionHref } from '../../../transaction/utils/get-transaction-href.util';
import { StartDepositForm } from '../start-deposit-form/start-deposit-form';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const StartDepositAccount = ({ transaction }: Props) => {
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    const [sourceEntry] = categoryEntries;
    const isEligible = isExpenseTransaction(transaction) && !isDefined(transaction.consolidationType) && categoryEntries.length === 1;

    if (!isEligible || !isDefined(sourceEntry)) {
        return <Redirect href={getTransactionHref(transaction)} />;
    }

    return <StartDepositForm transactionId={transaction.id} sourceEntry={sourceEntry} />;
};
