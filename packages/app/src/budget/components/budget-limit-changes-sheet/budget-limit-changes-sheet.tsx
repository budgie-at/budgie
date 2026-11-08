import { BudgetService } from '@budgie/budget';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Text } from 'react-native';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { FormsheetHeader } from '../../../@generic/component/formsheet-header/formsheet-header';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ScrollableSheetCard } from '../../../@generic/component/scrollable-sheet-card/scrollable-sheet-card';
import { MORPHING_SHEET_DESTINATION_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { useGetBudgetLimitChangesQuery } from '../../query/use-get-budget-limit-changes.query';
import { BudgetAutoTuneSwitchRow } from '../budget-auto-tune-switch-row/budget-auto-tune-switch-row';
import { BudgetLimitChangeRow } from '../budget-limit-change-row/budget-limit-change-row';
import { BudgetSheetState } from '../budget-sheet-state/budget-sheet-state';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface;
}

export const BudgetLimitChangesSheet = ({ budget }: Props) => {
    const { t } = useLingui();
    const { run } = useSingleFlight();
    const { limitChanges, isLoading, isError } = useGetBudgetLimitChangesQuery(budget.id);
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const emptyHint = (
        <Text className="text-sm text-secondary-foreground">
            <Trans>No limit changes yet</Trans>
        </Text>
    );

    const handleAutoTuneChange = (isAutoTuneEnabled: boolean) => {
        void run(
            Effect.flatMap(BudgetService, budgetService => budgetService.updateBudget(budget.id, { isAutoTuneEnabled })).pipe(
                toastOnFailure(t`Could not save budget`)
            )
        );
    };

    if (isError) {
        return <BudgetSheetState title={t`Limit changes`} isLoading={false} isError />;
    }

    return (
        <ScrollableSheetCard
            header={<FormsheetHeader size="md" title={t`Limit changes`} />}
            ratio={MORPHING_SHEET_DESTINATION_HEIGHT_RATIO}
            contentClassName="px-5xl pt-md gap-y-3xl pb-3xl"
            testID={BudgetSelector.LimitChangesSheet}
        >
            <LoadingContent isLoading={isLoading} className="gap-y-3xl">
                {isEmptyArray(limitChanges) ? (
                    emptyHint
                ) : (
                    <GroupedListSection>
                        {limitChanges.map(change => (
                            <BudgetLimitChangeRow key={change.id} change={change} currencySymbol={currencySymbol} />
                        ))}
                    </GroupedListSection>
                )}
                <BudgetAutoTuneSwitchRow
                    value={budget.isAutoTuneEnabled}
                    onValueChange={handleAutoTuneChange}
                    testID={BudgetSelector.LimitChangesAutoTuneSwitch}
                />
            </LoadingContent>
        </ScrollableSheetCard>
    );
};
