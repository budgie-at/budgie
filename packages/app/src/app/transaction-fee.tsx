import { isDefined } from '@rnw-community/shared';

import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { TransactionFeeModalContent } from '../transaction/components/transaction-fee-modal-content/transaction-fee-modal-content';

import type { ModalResult } from '../@generic/type/modal-result.type';

export default function TransactionFeeModal() {
    const { params: currentParams, resolve: resolveTransactionFee } = useModalRoute('/transaction-fee');
    useModalRouteState(currentParams);
    const { handleCommit, handleDismissed } = useMorphingSheetResult<ModalResult<'/transaction-fee'>>(resolveTransactionFee);

    if (!isDefined(currentParams)) {
        return null;
    }

    return (
        <TransactionFeeModalContent
            accountId={currentParams.accountId}
            currencySymbol={currentParams.currencySymbol}
            entry={currentParams.entry}
            variant={currentParams.variant}
            onConfirm={handleCommit}
            onDismiss={handleDismissed}
        />
    );
}
