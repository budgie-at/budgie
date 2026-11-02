import { Text, useWindowDimensions, View } from 'react-native';

import { CATEGORIZE_INBOX_STACKED_FONT_SCALE } from '../../constant/categorize-inbox-stacked-font-scale.constant';
import { formatCategorizeInboxMerchantTitle } from '../../utils/format-categorize-inbox-merchant-title.util';
import { CategorizeInboxGroupRowAmount } from '../categorize-inbox-group-row-amount/categorize-inbox-group-row-amount';
import { CategorizeInboxGroupRowSubtitle } from '../categorize-inbox-group-row-subtitle/categorize-inbox-group-row-subtitle';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';
import type { ReactNode } from 'react';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
    readonly children: ReactNode;
}

export const CategorizeInboxGroupRowBody = ({ cluster, children }: Props) => {
    const { fontScale } = useWindowDimensions();

    const isStacked = fontScale >= CATEGORIZE_INBOX_STACKED_FONT_SCALE;
    const containerClassName = isStacked ? 'min-w-0 flex-1 gap-y-xxs' : 'min-w-0 flex-1 flex-row items-center gap-x-md';
    const textClassName = isStacked ? 'gap-y-xxs' : 'min-w-0 flex-1 gap-y-xxs';

    return (
        <View className={containerClassName}>
            <View className={textClassName}>
                <Text className="text-[15px] leading-[20px] font-semibold text-primary" numberOfLines={2}>
                    {formatCategorizeInboxMerchantTitle(cluster.displayTitle)}
                </Text>
                <CategorizeInboxGroupRowSubtitle cluster={cluster} />
            </View>
            <View className="shrink-0 items-end gap-y-[6px]">
                <CategorizeInboxGroupRowAmount cluster={cluster} />
                {children}
            </View>
        </View>
    );
};
