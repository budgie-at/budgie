import { View } from 'react-native';

import { CategorizeInboxCategoryChip } from '../categorize-inbox-category-chip/categorize-inbox-category-chip';
import { CategorizeInboxOtherChip } from '../categorize-inbox-other-chip/categorize-inbox-other-chip';

import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxCategoryChips = ({ cluster }: Props) => (
    <View className="flex-row flex-wrap gap-x-sm gap-y-sm">
        {cluster.candidates.map((candidate, index) => (
            <CategorizeInboxCategoryChip
                key={candidate.categoryId}
                cluster={cluster}
                candidate={candidate}
                index={index}
                isTop={index === 0}
            />
        ))}
        <CategorizeInboxOtherChip cluster={cluster} />
    </View>
);
