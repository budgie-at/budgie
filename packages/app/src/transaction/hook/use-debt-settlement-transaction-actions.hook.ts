import { AccountTypeEnum, TransactionEntryKindEnum } from '@budgie/contracts';
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
    const hasDebtSettlement = transaction.entries.some(entry => entry.kind === TransactionEntryKindEnum.DEBT_SETTLEMENT);

    const handleOpenDebtSettlement = () =>
        void openAccountSelector({
            includeAccountTypes: [AccountTypeEnum.DEBT],
            debtType,
            excludeAccountId: transactionAccountId ?? 0,
            emptyStateDescription
        })
            .then(async debtAccountId => {
                if (isDefined(debtAccountId)) {
                    await transactionDebtSettlementService.attach({ transactionId, debtAccountId });
                }

                return null;
            })
            .catch(() => void Toast.show({ type: 'error', text1: attachErrorMessage }));

    const handleDetachDebtSettlement = () =>
        void transactionDebtSettlementService
            .detach(transactionId)
            .catch(() => void Toast.show({ type: 'error', text1: detachErrorMessage }));

    return {
        handleOpenDebtSettlement,
        handleDetachDebtSettlement,
        hasDebtSettlement
    };
};
