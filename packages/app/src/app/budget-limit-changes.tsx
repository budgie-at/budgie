import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { goBackOrReplace } from '../@generic/utils/go-back-or-replace.util';
import { BudgetLimitChangesSheet } from '../budget/components/budget-limit-changes-sheet/budget-limit-changes-sheet';
import { BudgetSheetState } from '../budget/components/budget-sheet-state/budget-sheet-state';
import { useGetActiveBudgetQuery } from '../budget/query/use-get-active-budget.query';

export default function BudgetLimitChangesRoute() {
    const { t } = useLingui();
    const { budget, isLoading, isError } = useGetActiveBudgetQuery();
    const handleDismissed = () => void goBackOrReplace('/');
    const content = isDefined(budget) ? (
        <BudgetLimitChangesSheet budget={budget} />
    ) : (
        <BudgetSheetState title={t`Limit changes`} isLoading={isLoading} isError={isError} />
    );

    return <SingleStepMorphingSheet onDismiss={handleDismissed}>{content}</SingleStepMorphingSheet>;
}
