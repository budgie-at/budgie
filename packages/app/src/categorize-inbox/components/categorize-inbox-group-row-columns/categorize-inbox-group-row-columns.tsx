import { Text, View } from 'react-native';

import { formatCategorizeInboxMerchantTitle } from '../../utils/format-categorize-inbox-merchant-title.util';
import { CategorizeInboxGroupRowAmount } from '../categorize-inbox-group-row-amount/categorize-inbox-group-row-amount';
import { CategorizeInboxGroupRowCount } from '../categorize-inbox-group-row-count/categorize-inbox-group-row-count';
import { CategorizeInboxGroupRowSubtitle } from '../categorize-inbox-group-row-subtitle/categorize-inbox-group-row-subtitle';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupRowColumns = ({ cluster }: Props) => (
    <View className="min-w-0 flex-1 flex-row gap-x-md">
        <View className="min-w-0 flex-1 gap-y-xxs">
            <Text className="text-[15px] leading-[20px] font-semibold text-primary" numberOfLines={2}>
                {formatCategorizeInboxMerchantTitle(cluster.displayTitle)}
            </Text>
            <CategorizeInboxGroupRowSubtitle cluster={cluster} />
        </View>
        <View className="shrink-0 items-end justify-between gap-y-xxs self-stretch">
            <CategorizeInboxGroupRowAmount cluster={cluster} />
            <CategorizeInboxGroupRowCount cluster={cluster} />
        </View>
    </View>
);
