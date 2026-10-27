import { AccountTypeEnum, DebtEventAssociationEnum, TransactionTypeEnum } from '@budgie/contracts';
import { AccountService, TransactionDebtSettlementService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { useAccountSelectorModal } from '../../account/context/account-selector-modal.context';

import type { DebtSettlementAccountInterface } from '../interface/debt-settlement-account.interface';
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
    const transactionDebtSettlementAccount = transactionDebtEvent?.[DebtEventAssociationEnum.DEBT_ACCOUNT] ?? null;
    const [localDebtSettlementAccount, setLocalDebtSettlementAccount] = useState<DebtSettlementAccountInterface | null>(
        transactionDebtSettlementAccount
    );
    const hasDebtSettlement = isDefined(localDebtSettlementAccount);

    const attachDebtSettlement = (debtAccountId: number) =>
        Effect.gen(function* () {
            const accountService = yield* AccountService;
            const transactionDebtSettlementService = yield* TransactionDebtSettlementService;
            const debtAccount = yield* accountService.findByIdOrFail(debtAccountId);

            yield* transactionDebtSettlementService.attach({ transactionId, debtAccountId });

            setLocalDebtSettlementAccount(debtAccount);
        });

    const handleOpenDebtSettlement = () => {
        if (transaction.type !== TransactionTypeEnum.EXPENSE && transaction.type !== TransactionTypeEnum.INCOME) {
            Toast.show({ type: 'error', text1: t`Could not attach debt` });

            return;
        }

        openAccountSelector(
            {
                includeAccountTypes: [AccountTypeEnum.DEBT],
                excludeAccountId: transactionAccountId ?? 0,
                ...(isDefined(debtType) && { debtType }),
                emptyStateDescription: t`Create a debt account first.`,
                showDebtTotal: true
            },
            debtAccountId => {
                if (isDefined(debtAccountId)) {
                    appRuntime.runFork(logAndContinue(attachDebtSettlement(debtAccountId).pipe(toastOnFailure(t`Could not attach debt`))));
                }
            }
        );
    };

    const handleDetachDebtSettlement = () =>
        void appRuntime.runFork(
            logAndContinue(
                Effect.flatMap(TransactionDebtSettlementService, transactionDebtSettlementService =>
                    transactionDebtSettlementService.detach(transactionId)
                ).pipe(
                    Effect.tap(() => Effect.sync(() => void setLocalDebtSettlementAccount(null))),
                    toastOnFailure(t`Could not update transaction.`)
                )
            )
        );

    return {
        handleOpenDebtSettlement,
        handleDetachDebtSettlement,
        hasDebtSettlement,
        debtSettlementAccount: localDebtSettlementAccount
    };
};
