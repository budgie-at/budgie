import { router } from 'expo-router';
import { useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { TransactionFeeModalContent } from '../transaction/components/transaction-fee-modal-content/transaction-fee-modal-content';
import { useTransactionFeeModal, useTransactionFeeModalParams } from '../transaction/context/transaction-fee-modal.context';

import type { TransactionFeeModalResult } from '../transaction/context/transaction-fee-modal.context';

export default function TransactionFeeModal() {
    const [, resolveTransactionFee, dismissTransactionFee] = useTransactionFeeModal();
    const currentParams = useTransactionFeeModalParams();
    const pendingResultRef = useRef<TransactionFeeModalResult | null>(null);
    useModalRouteState(currentParams, dismissTransactionFee);

    const handleConfirm = (result: TransactionFeeModalResult) => {
        pendingResultRef.current = result;
    };

    const handleDismissed = () => {
        if (isDefined(pendingResultRef.current)) {
            resolveTransactionFee(pendingResultRef.current);

            return;
        }

        router.back();
    };

    if (!currentParams) {
        return null;
    }

    return (
        <TransactionFeeModalContent
            accountId={currentParams.accountId}
            currencySymbol={currentParams.currencySymbol}
            entry={currentParams.entry}
            variant={currentParams.variant}
            onConfirm={handleConfirm}
            onDismiss={handleDismissed}
        />
    );
}
