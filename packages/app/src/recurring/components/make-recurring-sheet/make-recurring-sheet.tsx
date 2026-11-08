import { RecurringService } from '@budgie/recurring';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { ScrollView, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { SheetTitleRow } from '../../../@generic/component/sheet-title-row/sheet-title-row';
import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { useMorphingSheetCommit } from '../../../@generic/hook/use-morphing-sheet-commit.hook';
import { useMorphingSheetListHeight } from '../../../@generic/hook/use-morphing-sheet-list-height.hook';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { MakeRecurringResultKindEnum } from '../../enum/make-recurring-result-kind.enum';
import { RecurringRefreshModeEnum } from '../../enum/recurring-refresh-mode.enum';
import { useRecurringFittingSeries } from '../../hook/use-recurring-fitting-series.hook';
import { scheduleRecurringRefresh } from '../../utils/schedule-recurring-refresh.util';
import { MakeRecurringCreateRow } from '../make-recurring-create-row/make-recurring-create-row';
import { MakeRecurringFittingRow } from '../make-recurring-fitting-row/make-recurring-fitting-row';
import { MakeRecurringSourceRow } from '../make-recurring-source-row/make-recurring-source-row';

import { MakeRecurringSheetSelector } from './make-recurring-sheet.selector';

import type { MakeRecurringResultType } from '../../interface/make-recurring-result.type';
import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

interface Props {
    readonly transactionId: number;
    readonly onCommit: (result: MakeRecurringResultType) => void;
}

export const MakeRecurringSheet = ({ transactionId, onCommit }: Props) => {
    const { t } = useLingui();
    const { height } = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);
    const scrollStyle = { flexGrow: 0, maxHeight: height };
    const { now, fittingSeries, isLoading } = useRecurringFittingSeries(transactionId);
    const addFlight = useSingleFlight();
    const commit = useMorphingSheetCommit(onCommit);

    const handleCreate = () => void commit({ kind: MakeRecurringResultKindEnum.CREATE });

    const handleSelect = ({ id, title }: RecurringSeriesListItemInterface) =>
        void addFlight.run(
            Effect.gen(function* () {
                const recurringService = yield* RecurringService;

                yield* recurringService.addTransaction(id, transactionId);
                yield* scheduleRecurringRefresh(RecurringRefreshModeEnum.RECENT);
                yield* Effect.sync(() => void commit({ kind: MakeRecurringResultKindEnum.ADDED, seriesId: id, seriesTitle: title }));
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
        <View className="flex-none" testID={MakeRecurringSheetSelector.Page}>
            <SheetSurface
                className="flex-none pt-lg"
                contentClassName="flex-none"
                header={
                    <View className="px-xl">
                        <SheetTitleRow title={t`Make recurring`} />
                    </View>
                }
            >
                <ScrollView style={scrollStyle} bounces={false} showsVerticalScrollIndicator={false}>
                    <LoadingContent isLoading={isBusy} containerClassName="min-h-[120px]" className="gap-y-5xl px-3xl pt-xl pb-[16px]">
                        <MakeRecurringSourceRow transactionId={transactionId} />
                        {existingSection}
                        <GroupedListSection>
                            <MakeRecurringCreateRow onPress={handleCreate} />
                        </GroupedListSection>
                    </LoadingContent>
                </ScrollView>
            </SheetSurface>
        </View>
    );
};
