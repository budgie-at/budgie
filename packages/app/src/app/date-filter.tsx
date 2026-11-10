import { DateFilterSheetContent } from '../@generic/component/date-filter-sheet-content/date-filter-sheet-content';
import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { TransactionFiltersSelector } from '../transaction/components/transaction-filters/transaction-filters.selector';

import type { ModalResult } from '../@generic/type/modal-result.type';

export default function DateFilterModal() {
    const { params: currentParams, resolve: resolveDateFilter } = useModalRoute('/date-filter');
    const { handleCommit, handleDismissed } = useMorphingSheetResult<ModalResult<'/date-filter'>>(resolveDateFilter);

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
