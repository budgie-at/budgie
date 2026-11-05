import { isExpenseTransaction } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { showActionToast } from '../../@generic/utils/show-action-toast/show-action-toast';
import { useConvertToInstallmentModal } from '../context/convert-to-installment-modal.context';

import { useRevertInstallmentPlan } from './use-revert-installment-plan.hook';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useOpenConvertToInstallment = (transaction: TransactionWithRelationsEntityInterface) => {
    const { t } = useLingui();
    const [openConvertToInstallment] = useConvertToInstallmentModal();
    const { revert } = useRevertInstallmentPlan();
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

    const handleUndoPlan = (accountId: number) => () =>
        void revert(
            accountId,
            () => {
                if (router.canGoBack()) {
                    router.back();
                } else {
                    router.replace('/');
                }
            },
            false
        );

    return () =>
        void openConvertToInstallment(
            {
                transactionId: transaction.id,
                title: transaction.title,
                amount: Math.abs(sourceEntry.amount),
                instrumentSymbol: sourceEntry.account.instrument.symbol,
                accountTitle: sourceEntry.account.title,
                operatedAt: transaction.operatedAt
            },
            accountId => {
                if (isDefined(accountId)) {
                    showActionToast(t`Plan created`, { label: t`Undo`, onPress: handleUndoPlan(accountId) });
                    router.push({ pathname: '/account/[id]/details', params: { id: String(accountId) } });
                }
            }
        );
};
