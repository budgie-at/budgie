import { Text, View } from 'react-native';

import { formatCategorizeInboxMerchantTitle } from '../../utils/format-categorize-inbox-merchant-title.util';
import { CategorizeInboxGroupRowStackedMeta } from '../categorize-inbox-group-row-stacked-meta/categorize-inbox-group-row-stacked-meta';
import { CategorizeInboxGroupRowSubtitle } from '../categorize-inbox-group-row-subtitle/categorize-inbox-group-row-subtitle';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupRowStackedBody = ({ cluster }: Props) => (
    <View className="min-w-0 flex-1 gap-y-xxs">
        <Text className="text-[15px] leading-[20px] font-semibold text-primary">
            {formatCategorizeInboxMerchantTitle(cluster.displayTitle)}
        </Text>
        <CategorizeInboxGroupRowSubtitle cluster={cluster} />
        <CategorizeInboxGroupRowStackedMeta cluster={cluster} />
    </View>
);
