import { useLocalSearchParams } from 'expo-router';

import { CategorizeInboxPage } from '../../../categorize-inbox/components/categorize-inbox-page/categorize-inbox-page';
import { parseAnalyticsTransactionsRouteParams } from '../../../transaction/utils/parse-analytics-transactions-route-params.util';

import type { AnalyticsTransactionsSearchParamsType } from '../../../transaction/type/analytics-transactions-search-params.type';

export default function CategorizeIndexPage() {
    const searchParams = useLocalSearchParams<AnalyticsTransactionsSearchParamsType>();

    return <CategorizeInboxPage params={parseAnalyticsTransactionsRouteParams(searchParams)} />;
}
