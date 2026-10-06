import { isExpenseTransaction } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { useConvertToInstallmentModal } from '../context/convert-to-installment-modal.context';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useOpenConvertToInstallment = (transaction: TransactionWithRelationsEntityInterface) => {
    const { t } = useLingui();
    const [openConvertToInstallment] = useConvertToInstallmentModal();
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    const [sourceEntry, ...extraEntries] = categoryEntries;
    const isEligible =
        isExpenseTransaction(transaction) &&
        !isDefined(transaction.consolidationType) &&
        !isDefined(transaction.consolidationParentTransactionId) &&
        !isDefined(transaction.debtEvents.at(0)) &&
        isEmptyArray(extraEntries);

    if (!isEligible || !isDefined(sourceEntry)) {
        return null;
    }

    return () =>
        void openConvertToInstallment({
            transactionId: transaction.id,
            title: transaction.title,
            amount: Math.abs(sourceEntry.amount),
            instrumentSymbol: sourceEntry.account.instrument.symbol,
            accountTitle: sourceEntry.account.title,
            operatedAt: transaction.operatedAt
        }).then(accountId => {
            if (isDefined(accountId)) {
                Toast.show({ type: 'success', text1: t`Plan created` });
                router.push({ pathname: '/account/[id]/details', params: { id: String(accountId) } });
            }

            return null;
        });
};
