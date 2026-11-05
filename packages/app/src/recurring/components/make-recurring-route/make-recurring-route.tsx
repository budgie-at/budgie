import { useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { parsePositiveRouteParam } from '../../../@generic/utils/parse-positive-route-param.util';
import { MakeRecurringSheet } from '../make-recurring-sheet/make-recurring-sheet';

export const MakeRecurringRoute = () => {
    const { transactionId } = useLocalSearchParams<{ transactionId?: string | string[] }>();
    const parsedTransactionId = parsePositiveRouteParam(transactionId);

    return isDefined(parsedTransactionId) ? <MakeRecurringSheet transactionId={parsedTransactionId} /> : null;
};
