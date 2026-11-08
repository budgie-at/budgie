import { useLocalSearchParams } from 'expo-router';

import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { goBackOrReplace } from '../@generic/utils/go-back-or-replace.util';
import { BudgetPeriodSummary } from '../budget/components/budget-period-summary/budget-period-summary';

export default function BudgetPeriodSummaryModal() {
    const { snapshotId } = useLocalSearchParams<{ snapshotId: string }>();
    const handleDismissed = () => void goBackOrReplace('/');

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed} isContentDraggable={false}>
            <BudgetPeriodSummary snapshotId={Number(snapshotId)} />
        </SingleStepMorphingSheet>
    );
}
