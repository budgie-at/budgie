import { useLocalSearchParams } from 'expo-router';

import { normalizeRouteParam } from '../../../../@generic/utils/normalize-route-param.util';
import { CategorizeInboxTransferScreen } from '../../../../categorize-inbox/components/categorize-inbox-transfer-screen/categorize-inbox-transfer-screen';

export default function CategorizeInboxTransferPage() {
    const { key } = useLocalSearchParams<{ readonly key: string }>();

    return <CategorizeInboxTransferScreen clusterKey={normalizeRouteParam(key) ?? ''} />;
}
