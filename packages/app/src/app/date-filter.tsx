import { DateFilterSheetContent } from '../@generic/component/date-filter-sheet-content/date-filter-sheet-content';
import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useDateFilterModal, useDateFilterModalParams } from '../@generic/context/date-filter-modal.context';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { TransactionFiltersSelector } from '../transaction/components/transaction-filters/transaction-filters.selector';

import type { DateFilterResult } from '../@generic/context/date-filter-modal.context';

export default function DateFilterModal() {
    const [, resolveDateFilter, dismissDateFilter] = useDateFilterModal();
    useModalDismiss(dismissDateFilter);
    const currentParams = useDateFilterModalParams();
    const { handleCommit, handleDismissed } = useMorphingSheetResult<DateFilterResult>(resolveDateFilter);

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <DateFilterSheetContent
                range={currentParams?.value ?? null}
                onCommit={handleCommit}
                datePeriodTestID={TransactionFiltersSelector.DatePeriod}
                applyTestID={TransactionFiltersSelector.DateApplyButton}
            />
        </SingleStepMorphingSheet>
    );
}
