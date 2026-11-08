import { useRouter } from 'expo-router';
import { useRef } from 'react';

import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { TransactionAccountFilterContent } from '../transaction/components/transaction-account-filter-content/transaction-account-filter-content';
import {
    useTransactionAccountFilterModal,
    useTransactionAccountFilterModalParams
} from '../transaction/context/transaction-account-filter-modal.context';

import type { TransactionAccountFilterResult } from '../transaction/context/transaction-account-filter-modal.context';

export default function TransactionAccountFilterModal() {
    const router = useRouter();
    const [, resolveTransactionAccountFilter, dismissTransactionAccountFilter] = useTransactionAccountFilterModal();
    useModalDismiss(dismissTransactionAccountFilter);
    const currentParams = useTransactionAccountFilterModalParams();
    const isCreateAccountPendingRef = useRef(false);

    const handleResolved = (result: TransactionAccountFilterResult) => {
        if (isCreateAccountPendingRef.current) {
            isCreateAccountPendingRef.current = false;
            resolveTransactionAccountFilter(null, { skipBack: true });
            router.dismiss();
            void router.push('/create-account');

            return;
        }

        resolveTransactionAccountFilter(result);
    };

    const { handleCommit, handleDismissed } = useMorphingSheetResult<TransactionAccountFilterResult>(handleResolved);

    const handleCreateAccount = () => {
        isCreateAccountPendingRef.current = true;
    };

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed} isContentDraggable={false}>
            <TransactionAccountFilterContent
                value={currentParams?.value ?? null}
                onCommit={handleCommit}
                onCreateAccount={handleCreateAccount}
            />
        </SingleStepMorphingSheet>
    );
}
