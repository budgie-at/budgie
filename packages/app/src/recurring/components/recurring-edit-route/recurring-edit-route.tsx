import { useAtomValue } from '@effect/atom-react/Hooks';

import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { RecurringFormModeEnum } from '../../enum/recurring-form-mode.enum';
import { useRecurringNow } from '../../hook/use-recurring-now.hook';
import { buildRecurringFormValuesFromSeries } from '../../utils/build-recurring-form-values-from-series.util';
import { RecurringDetailGuard } from '../recurring-detail-guard/recurring-detail-guard';
import { RecurringSeriesFormScreen } from '../recurring-series-form-screen/recurring-series-form-screen';

export const RecurringEditRoute = () => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const now = useRecurringNow();

    return (
        <RecurringDetailGuard>
            {detail => {
                const target = {
                    mode: RecurringFormModeEnum.EDIT,
                    seriesId: detail.series.id,
                    source: detail.series.source,
                    anchorDate: detail.anchorDate
                } as const;

                return (
                    <RecurringSeriesFormScreen
                        target={target}
                        initialValues={buildRecurringFormValuesFromSeries(detail, defaultInstrument.id, now)}
                    />
                );
            }}
        </RecurringDetailGuard>
    );
};
