import { useLocalSearchParams } from 'expo-router';

import { normalizeRouteParam } from '../../../../@generic/utils/normalize-route-param.util';
import { CategorizeInboxPaymentsScreen } from '../../../../categorize-inbox/components/categorize-inbox-payments-screen/categorize-inbox-payments-screen';

export default function CategorizeInboxPaymentsPage() {
    const { key } = useLocalSearchParams<{ readonly key: string }>();

    return <CategorizeInboxPaymentsScreen clusterKey={normalizeRouteParam(key) ?? ''} />;
}
