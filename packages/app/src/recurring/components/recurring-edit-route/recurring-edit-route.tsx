import { useAtomValue } from '@effect/atom-react/Hooks';
import { Redirect, useIsFocused, useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { IdParamInterface } from '../../../@generic/interface/id-param.interface';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { RecurringFormModeEnum } from '../../enum/recurring-form-mode.enum';
import { useRecurringNow } from '../../hook/use-recurring-now.hook';
import { useRecurringSeriesDetail } from '../../hook/use-recurring-series-detail.hook';
import { buildRecurringFormValuesFromSeries } from '../../utils/build-recurring-form-values-from-series.util';
import { RecurringSeriesFormScreen } from '../recurring-series-form-screen/recurring-series-form-screen';

export const RecurringEditRoute = () => {
    const isFocused = useIsFocused();
    const { id } = useLocalSearchParams<IdParamInterface>();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const now = useRecurringNow();
    const { detail, isNotFound } = useRecurringSeriesDetail(Number(id));

    if (isNotFound) {
        return isFocused ? <Redirect href="/" /> : null;
    }

    if (!isDefined(detail)) {
        return null;
    }

    const target = { mode: RecurringFormModeEnum.EDIT, seriesId: detail.series.id } as const;

    return (
        <RecurringSeriesFormScreen target={target} initialValues={buildRecurringFormValuesFromSeries(detail, defaultInstrument.id, now)} />
    );
};
