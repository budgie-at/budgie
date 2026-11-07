import { Redirect, useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { parsePositiveRouteParam } from '../../../@generic/utils/parse-positive-route-param.util';
import { InzhurPurchasePage } from '../../../inzhur/component/inzhur-purchase-page/inzhur-purchase-page';

export default function InzhurPurchase() {
    const { topUpId } = useLocalSearchParams<{ topUpId?: string }>();
    const topUpTransactionId = parsePositiveRouteParam(topUpId);

    return isDefined(topUpTransactionId) ? <InzhurPurchasePage topUpTransactionId={topUpTransactionId} /> : <Redirect href="/" />;
}
