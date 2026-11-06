import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { parsePositiveRouteParam } from '../../../@generic/utils/parse-positive-route-param.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useGetTransactionByIdQuery } from '../../../transaction/query/use-get-transaction-by-id.query';
import { RecurringFormModeEnum } from '../../enum/recurring-form-mode.enum';
import { useRecurringNow } from '../../hook/use-recurring-now.hook';
import { buildDefaultRecurringFormValues } from '../../utils/build-default-recurring-form-values.util';
import { buildRecurringFormValuesFromTransaction } from '../../utils/build-recurring-form-values-from-transaction.util';
import { RecurringSeriesFormScreen } from '../recurring-series-form-screen/recurring-series-form-screen';

export const RecurringCreateRoute = () => {
    const { transactionId } = useLocalSearchParams<{ transactionId?: string | string[] }>();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const now = useRecurringNow();
    const parsedTransactionId = parsePositiveRouteParam(transactionId);
    const { transaction, isLoading } = useGetTransactionByIdQuery(parsedTransactionId);

    if (isLoading) {
        return null;
    }

    const initialValues = isDefined(transaction)
        ? buildRecurringFormValuesFromTransaction(transaction, defaultInstrument.id)
        : buildDefaultRecurringFormValues(defaultInstrument.id, now);

    const target = { mode: RecurringFormModeEnum.CREATE, transactionId: parsedTransactionId } as const;

    return <RecurringSeriesFormScreen target={target} initialValues={initialValues} />;
};
