import { Text, View } from 'react-native';

import { CategorizeInboxGroupRowAmount } from '../categorize-inbox-group-row-amount/categorize-inbox-group-row-amount';
import { CategorizeInboxGroupRowCount } from '../categorize-inbox-group-row-count/categorize-inbox-group-row-count';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: Pick<CategorizeInboxClusterInterface, 'rows' | 'totalBaseAmount'>;
}

export const CategorizeInboxGroupRowStackedMeta = ({ cluster }: Props) => (
    <View className="flex-row flex-wrap items-baseline gap-x-xs">
        <CategorizeInboxGroupRowAmount cluster={cluster} />
        <Text className="text-[13px] leading-[17px] text-secondary-foreground">·</Text>
        <CategorizeInboxGroupRowCount cluster={cluster} />
    </View>
);
