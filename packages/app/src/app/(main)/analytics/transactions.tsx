import { useLocalSearchParams } from 'expo-router';

import { AnalyticsTransactionsRoute } from '../../../transaction/components/analytics-transactions-route/analytics-transactions-route';
import { parseAnalyticsTransactionsRouteParams } from '../../../transaction/utils/parse-analytics-transactions-route-params.util';

import type { AnalyticsTransactionsSearchParamsType } from '../../../transaction/type/analytics-transactions-search-params.type';

export default function AnalyticsTransactionsPage() {
    const searchParams = useLocalSearchParams<AnalyticsTransactionsSearchParamsType>();

    return <AnalyticsTransactionsRoute params={parseAnalyticsTransactionsRouteParams(searchParams)} />;
}
