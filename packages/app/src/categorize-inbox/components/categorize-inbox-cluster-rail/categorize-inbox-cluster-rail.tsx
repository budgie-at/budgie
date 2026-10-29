import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { View } from 'react-native';

import { CategorizeInboxAlreadyTrackedChip } from '../categorize-inbox-already-tracked-chip/categorize-inbox-already-tracked-chip';
import { CategorizeInboxClusterMenu } from '../categorize-inbox-cluster-menu/categorize-inbox-cluster-menu';
import { CategorizeInboxMoveToCashChip } from '../categorize-inbox-move-to-cash-chip/categorize-inbox-move-to-cash-chip';
import { CategorizeInboxSuggestionChips } from '../categorize-inbox-suggestion-chips/categorize-inbox-suggestion-chips';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxClusterRail = ({ cluster }: Props) => (
    <View className="flex-row items-center gap-x-sm">
        <View className="flex-1 flex-row flex-wrap items-center gap-sm">
            {cluster.section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS ? (
                <>
                    <CategorizeInboxMoveToCashChip cluster={cluster} />
                    <CategorizeInboxAlreadyTrackedChip cluster={cluster} />
                </>
            ) : null}
            <CategorizeInboxSuggestionChips cluster={cluster} />
        </View>

        <CategorizeInboxClusterMenu cluster={cluster} />
    </View>
);
