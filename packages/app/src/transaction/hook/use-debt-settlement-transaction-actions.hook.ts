import { AccountTypeEnum, TransactionEntryKindEnum } from '@budgie/contracts';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { useAccountSelectorModal } from '../../account/context/account-selector-modal.context';
import { transactionDebtSettlementService } from '../service/transaction-debt-settlement.service';

import type { DebtSettlementTransactionActionsParamsInterface } from '../interface/debt-settlement-transaction-actions-params.interface';

export const useDebtSettlementTransactionActions = ({
    transaction,
    transactionId,
    transactionAccountId,
    debtType,
    emptyStateDescription,
    attachErrorMessage,
    detachErrorMessage
}: DebtSettlementTransactionActionsParamsInterface) => {
    const [openAccountSelector] = useAccountSelectorModal();
    const transactionDebtSettlementEntry = transaction.entries.find(entry => entry.kind === TransactionEntryKindEnum.DEBT_SETTLEMENT);
    const transactionDebtSettlementAccountTitle = transactionDebtSettlementEntry?.account.title ?? null;
    const transactionHasDebtSettlement = isDefined(transactionDebtSettlementEntry);
    const [localDebtSettlementState, setLocalDebtSettlementState] = useState<{
        readonly accountTitle: string | null;
        readonly isAttached: boolean;
    } | null>(null);
    const hasDebtSettlement = localDebtSettlementState?.isAttached ?? transactionHasDebtSettlement;
    const debtSettlementAccountTitle = localDebtSettlementState?.accountTitle ?? transactionDebtSettlementAccountTitle;

    const handleOpenDebtSettlement = () =>
        void openAccountSelector({
            includeAccountTypes: [AccountTypeEnum.DEBT],
            debtType,
            excludeAccountId: transactionAccountId ?? 0,
            emptyStateDescription
        })
            .then(async debtAccountId => {
                if (isDefined(debtAccountId)) {
                    const debtAccount = await transactionDebtSettlementService.attach({ transactionId, debtAccountId });

                    setLocalDebtSettlementState({ accountTitle: debtAccount.title, isAttached: true });
                }

                return null;
            })
            .catch(() => void Toast.show({ type: 'error', text1: attachErrorMessage }));

    const handleDetachDebtSettlement = () =>
        void transactionDebtSettlementService
            .detach(transactionId)
            .then(() => {
                setLocalDebtSettlementState({ accountTitle: null, isAttached: false });

                return null;
            })
            .catch(() => void Toast.show({ type: 'error', text1: detachErrorMessage }));

    return {
        handleOpenDebtSettlement,
        handleDetachDebtSettlement,
        hasDebtSettlement,
        debtSettlementAccountTitle
    };
};
