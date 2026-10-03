import { AccountTypeEnum, DebtEventAssociationEnum, TransactionTypeEnum } from '@budgie/contracts';
import { AccountService, TransactionDebtSettlementService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { useAccountSelectorModal } from '../../account/context/account-selector-modal.context';

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
        const debtAccountTitle = await appRuntime.runPromise(
            Effect.gen(function* () {
                const accountService = yield* AccountService;
                const transactionDebtSettlementService = yield* TransactionDebtSettlementService;
                const debtAccount = yield* accountService.findByIdOrFail(debtAccountId);

                yield* transactionDebtSettlementService.attach({ transactionId, debtAccountId });

                return debtAccount.title;
            })
        );
        setLocalDebtSettlementAccountTitle(debtAccountTitle);
    };

    const handleOpenDebtSettlement = () => {
        if (transaction.type !== TransactionTypeEnum.EXPENSE && transaction.type !== TransactionTypeEnum.INCOME) {
            Toast.show({ type: 'error', text1: t`Could not attach debt` });

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
        void appRuntime
            .runPromise(
                Effect.flatMap(TransactionDebtSettlementService, transactionDebtSettlementService =>
                    transactionDebtSettlementService.detach(transactionId)
                )
            )
            .then(() => void setLocalDebtSettlementAccountTitle(null))
            .catch(() => void Toast.show({ type: 'error', text1: t`Could not update transaction.` }));

    return {
        handleOpenDebtSettlement,
        handleDetachDebtSettlement,
        hasDebtSettlement,
        debtSettlementAccountTitle
    };
};
