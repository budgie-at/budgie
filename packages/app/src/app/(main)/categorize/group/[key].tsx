import { useLocalSearchParams } from 'expo-router';

import { normalizeRouteParam } from '../../../../@generic/utils/normalize-route-param.util';
import { CategorizeInboxGroupScreen } from '../../../../categorize-inbox/components/categorize-inbox-group-screen/categorize-inbox-group-screen';

export default function CategorizeInboxGroupPage() {
    const { key } = useLocalSearchParams<{ readonly key: string }>();

    return <CategorizeInboxGroupScreen clusterKey={normalizeRouteParam(key) ?? ''} />;
}
