import { AccountTypeEnum, DebtEventAssociationEnum, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { useAccountSelectorModal } from '../../account/context/account-selector-modal.context';
import { accountService } from '../../account/service/account.service';
import { transactionDebtSettlementService } from '../service/transaction-debt-settlement.service';

import type { DebtSettlementTransactionActionsParamsInterface } from '../interface/debt-settlement-transaction-actions-params.interface';

export const useDebtSettlementTransactionActions = ({
    transaction,
    transactionId,
    transactionAccountId,
    debtType
}: DebtSettlementTransactionActionsParamsInterface) => {
    const { t } = useLingui();
    const [openAccountSelector] = useAccountSelectorModal();
    const transactionDebtEvent = transaction.debtEvents.at(0);
    const transactionDebtSettlementAccountTitle = transactionDebtEvent?.[DebtEventAssociationEnum.DEBT_ACCOUNT].title ?? null;
    const [localDebtSettlementAccountTitle, setLocalDebtSettlementAccountTitle] = useState<string | null>(
        transactionDebtSettlementAccountTitle
    );
    const hasDebtSettlement = isDefined(localDebtSettlementAccountTitle);
    const debtSettlementAccountTitle = hasDebtSettlement ? localDebtSettlementAccountTitle : null;

    const attachDebtSettlement = async (debtAccountId: number) => {
        const debtAccount = await accountService.findByIdOrFail(debtAccountId);

        await transactionDebtSettlementService.attach({ transactionId, debtAccountId });
        setLocalDebtSettlementAccountTitle(debtAccount.title);
    };

    const handleOpenDebtSettlement = () => {
        if (transaction.type !== TransactionTypeEnum.INCOME) {
            Toast.show({ type: 'error', text1: t`Debt attachment is only available for income transactions` });

            return;
        }

        void openAccountSelector({
            includeAccountTypes: [AccountTypeEnum.DEBT],
            excludeAccountId: transactionAccountId ?? 0,
            ...(isDefined(debtType) && { debtType }),
            emptyStateDescription: t`Create a debt account first.`,
            showDebtTotal: true
        })
            .then(async debtAccountId => {
                if (isDefined(debtAccountId)) {
                    await attachDebtSettlement(debtAccountId);
                }

                return null;
            })
            .catch(() => void Toast.show({ type: 'error', text1: t`Could not attach debt` }));
    };

    const handleDetachDebtSettlement = () =>
        void transactionDebtSettlementService
            .detach(transactionId)
            .then(() => void setLocalDebtSettlementAccountTitle(null))
            .catch(() => void Toast.show({ type: 'error', text1: t`Could not update transaction.` }));

    return {
        handleOpenDebtSettlement,
        handleDetachDebtSettlement,
        hasDebtSettlement,
        debtSettlementAccountTitle
    };
};
