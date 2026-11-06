import { View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useInzhurPendingTopUpsQuery } from '../../query/use-inzhur-pending-top-ups.query';
import { InzhurPendingTopUpCard } from '../inzhur-pending-top-up-card/inzhur-pending-top-up-card';

const MAX_VISIBLE_TOP_UPS = 3;

export const InzhurPendingTopUps = () => {
    const pendingTopUps = useInzhurPendingTopUpsQuery();

    if (!isNotEmptyArray(pendingTopUps)) {
        return null;
    }

    return (
        <View className="gap-y-md">
            {pendingTopUps.slice(0, MAX_VISIBLE_TOP_UPS).map(topUp => (
                <InzhurPendingTopUpCard key={topUp.transactionId} topUp={topUp} />
            ))}
        </View>
    );
};
