import { useRouter } from 'expo-router';

import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { TransactionAccountFilterContent } from '../transaction/components/transaction-account-filter-content/transaction-account-filter-content';
import {
    useTransactionAccountFilterModal,
    useTransactionAccountFilterModalParams
} from '../transaction/context/transaction-account-filter-modal.context';
import { TransactionAccountFilterCommitKindEnum } from '../transaction/enum/transaction-account-filter-commit-kind.enum';

import type { TransactionAccountFilterCommitType } from '../transaction/interface/transaction-account-filter-commit.type';

export default function TransactionAccountFilterModal() {
    const router = useRouter();
    const [, resolveTransactionAccountFilter, dismissTransactionAccountFilter] = useTransactionAccountFilterModal();
    useModalDismiss(dismissTransactionAccountFilter);
    const currentParams = useTransactionAccountFilterModalParams();

    const handleResolved = (commit: TransactionAccountFilterCommitType) => {
        if (commit.kind === TransactionAccountFilterCommitKindEnum.CREATE_ACCOUNT) {
            resolveTransactionAccountFilter(null, { skipBack: true });
            router.dismiss();
            void router.push('/create-account');

            return;
        }

        resolveTransactionAccountFilter({ value: commit.value });
    };

    const { handleCommit, handleDismissed } = useMorphingSheetResult<TransactionAccountFilterCommitType>(handleResolved);

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <TransactionAccountFilterContent value={currentParams?.value ?? null} onCommit={handleCommit} />
        </SingleStepMorphingSheet>
    );
}
