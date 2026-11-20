import { use } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldKindFilterChip } from '../yield-kind-filter-chip/yield-kind-filter-chip';
import { YieldScopeFilterChip } from '../yield-scope-filter-chip/yield-scope-filter-chip';

export const YieldFilterChipRow = () => {
    const { screenKey } = use(YieldScreenContext);

    const { group } = screenKey.key;

    if (!isDefined(screenKey.scopeId) && !isDefined(group)) {
        return null;
    }

    return (
        <View className="mb-[6px] min-h-[44px] flex-row flex-wrap items-center gap-x-sm">
            {isDefined(screenKey.scopeId) ? <YieldScopeFilterChip /> : null}
            {isDefined(group) ? <YieldKindFilterChip group={group} /> : null}
        </View>
    );
};
