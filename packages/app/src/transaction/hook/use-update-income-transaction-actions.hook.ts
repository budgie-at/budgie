import { AccountDebtTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { dismissAllOrReplace } from '../../@generic/utils/dismiss-all-or-replace.util';
import { useConvertToRefundModal } from '../context/convert-to-refund-modal.context';
import { useConvertToTransferModal } from '../context/convert-to-transfer-modal.context';

import { useDebtSettlementTransactionActions } from './use-debt-settlement-transaction-actions.hook';
import { useRevertConsolidation } from './use-revert-consolidation.hook';

import type { UpdateIncomeTransactionActionsParamsInterface } from '../interface/update-income-transaction-actions-params.interface';

export const useUpdateIncomeTransactionActions = ({
    transaction,
    transactionId,
    toAccountId
}: UpdateIncomeTransactionActionsParamsInterface) => {
    const { t } = useLingui();
    const [openConvertToTransfer] = useConvertToTransferModal();
    const [openConvertToRefund] = useConvertToRefundModal();
    const [sourceEntry] = transaction.entries;
    const handleRevert = useRevertConsolidation(transactionId, () => void dismissAllOrReplace('/'));
    const { handleOpenDebtSettlement, handleDetachDebtSettlement, hasDebtSettlement, debtSettlementAccountTitle } =
        useDebtSettlementTransactionActions({
            transaction,
            transactionId,
            transactionAccountId: toAccountId,
            debtType: AccountDebtTypeEnum.LENT,
            emptyStateDescription: t`Create a lent debt account first.`,
            attachErrorMessage: t`Could not attach debt return`,
            detachErrorMessage: t`Could not detach debt return`
        });

    const handleOpenConvert = () =>
        void openConvertToTransfer({
            transactionId,
            transactionType: TransactionTypeEnum.INCOME,
            excludeAccountId: toAccountId ?? 0,
            sourceAmount: convertFromMicroUnits(sourceEntry.amount),
            sourceInstrumentId: sourceEntry.account.instrumentId,
            sourceCode: sourceEntry.account.instrument.code
        });

    const handleOpenRefundConvert = () =>
        void openConvertToRefund({
            refundIncomeTransactionId: transactionId
        }).then(canonicalId => {
            if (isDefined(canonicalId)) {
                const expenseRoute = `/transactions/${canonicalId}/expense` as const;

                router.replace(expenseRoute);
            }

            return null;
        });

    return {
        handleOpenConvert,
        handleOpenRefundConvert,
        handleOpenDebtSettlement,
        handleDetachDebtSettlement,
        handleRevert,
        hasDebtSettlement,
        debtSettlementAccountTitle
    };
};
