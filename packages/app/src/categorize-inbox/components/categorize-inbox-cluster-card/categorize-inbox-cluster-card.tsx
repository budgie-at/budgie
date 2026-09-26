import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { testID } from '../../../@generic/utils/test-id.util';
import { CategorizeInboxClusterRows } from '../categorize-inbox-cluster-rows/categorize-inbox-cluster-rows';
import { CategorizeInboxClusterSummary } from '../categorize-inbox-cluster-summary/categorize-inbox-cluster-summary';
import { CategorizeInboxSuggestionChips } from '../categorize-inbox-suggestion-chips/categorize-inbox-suggestion-chips';
import { CategorizeInboxSwipeToAccept } from '../categorize-inbox-swipe-to-accept/categorize-inbox-swipe-to-accept';

import { CategorizeInboxClusterCardSelector } from './categorize-inbox-cluster-card.selector';

import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxClusterCard = ({ cluster }: Props) => {
    const { t } = useLingui();

    const countText = t({ message: plural(cluster.rows.length, { one: '# transaction', other: '# transactions' }) });

    return (
        <CategorizeInboxSwipeToAccept key={cluster.key} cluster={cluster}>
            <Card size="sm" className="gap-y-lg" {...testID(CategorizeInboxClusterCardSelector.Card, cluster.key)}>
                <CategorizeInboxClusterSummary cluster={cluster} countText={countText} />

                <View className="flex-row items-center gap-x-sm">
                    <CategorizeInboxSuggestionChips cluster={cluster} />
                </View>

                <CategorizeInboxClusterRows cluster={cluster} />
            </Card>
        </CategorizeInboxSwipeToAccept>
    );
};
