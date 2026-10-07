import { isExpenseTransaction } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { Redirect } from 'expo-router';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { getTransactionHref } from '../../../transaction/utils/get-transaction-href.util';
import { StartDepositForm } from '../start-deposit-form/start-deposit-form';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const StartDepositAccount = ({ transaction }: Props) => {
    const [openedTransaction] = useState(transaction);
    const categoryEntries = getTransactionCategoryEntries(openedTransaction.entries);
    const [sourceEntry] = categoryEntries;
    const isEligible =
        isExpenseTransaction(openedTransaction) &&
        !isDefined(openedTransaction.consolidationType) &&
        !isDefined(openedTransaction.consolidationParentTransactionId) &&
        categoryEntries.length === 1;

    if (!isEligible || !isDefined(sourceEntry)) {
        return <Redirect href={getTransactionHref(openedTransaction)} />;
    }

    return <StartDepositForm transactionId={openedTransaction.id} sourceEntry={sourceEntry} />;
};
