import { RecurringService } from '@budgie/recurring';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';
import { View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { SheetTitleRow } from '../../../@generic/component/sheet-title-row/sheet-title-row';
import { GroupedSurfacePaletteEnum } from '../../../@generic/enum/grouped-surface-palette.enum';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { showActionToast } from '../../../@generic/utils/show-action-toast/show-action-toast';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { RecurringRefreshModeEnum } from '../../enum/recurring-refresh-mode.enum';
import { useRecurringFittingSeries } from '../../hook/use-recurring-fitting-series.hook';
import { scheduleRecurringRefresh } from '../../utils/schedule-recurring-refresh.util';
import { MakeRecurringCreateRow } from '../make-recurring-create-row/make-recurring-create-row';
import { MakeRecurringFittingRow } from '../make-recurring-fitting-row/make-recurring-fitting-row';
import { MakeRecurringSourceRow } from '../make-recurring-source-row/make-recurring-source-row';

import { MakeRecurringSheetSelector } from './make-recurring-sheet.selector';

import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

interface Props {
    readonly transactionId: number;
}

export const MakeRecurringSheet = ({ transactionId }: Props) => {
    const { t } = useLingui();
    const { now, fittingSeries, isLoading } = useRecurringFittingSeries(transactionId);
    const addFlight = useSingleFlight();

    const handleCreate = () => void router.replace({ pathname: '/recurring/create', params: { transactionId: String(transactionId) } });

    const handleSelect = ({ id, title }: RecurringSeriesListItemInterface) =>
        void addFlight.run(
            Effect.gen(function* () {
                const recurringService = yield* RecurringService;

                yield* recurringService.addTransaction(id, transactionId);
                yield* scheduleRecurringRefresh(RecurringRefreshModeEnum.RECENT);
                yield* Effect.sync(() => {
                    router.back();
                    showActionToast(t`Added to ${title}`, {
                        label: t`View`,
                        onPress: () => void router.push({ pathname: '/recurring/[id]', params: { id: String(id) } })
                    });
                });
            }).pipe(toastOnFailure(t`Could not add to recurring payment.`))
        );

    const isBusy = isLoading || addFlight.isLoading;
    const existingSection = isNotEmptyArray(fittingSeries) ? (
        <GroupedListSection title={t`Add to an existing payment`}>
            {fittingSeries.map(series => (
                <MakeRecurringFittingRow key={series.id} series={series} onSelect={handleSelect} now={now} />
            ))}
        </GroupedListSection>
    ) : null;

    return (
        <GroupedSurface palette={GroupedSurfacePaletteEnum.SHEET} className="flex-none" testID={MakeRecurringSheetSelector.Page}>
            <View>
                <View className="px-3xl pt-7xl pb-md">
                    <SheetTitleRow title={t`Make recurring`} />
                </View>
                <LoadingContent isLoading={isBusy} containerClassName="min-h-[120px]" className="gap-y-5xl px-3xl pt-xl pb-7xl">
                    <MakeRecurringSourceRow transactionId={transactionId} />
                    {existingSection}
                    <GroupedListSection>
                        <MakeRecurringCreateRow onPress={handleCreate} />
                    </GroupedListSection>
                </LoadingContent>
            </View>
        </GroupedSurface>
    );
};
