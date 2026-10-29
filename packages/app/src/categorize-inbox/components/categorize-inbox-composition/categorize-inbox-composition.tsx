import { View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { CATEGORIZE_INBOX_SECTION_ACCENT } from '../../constant/categorize-inbox-section-accent.constant';
import { CategorizeInboxLegendItem } from '../categorize-inbox-legend-item/categorize-inbox-legend-item';

import type { CategorizeInboxClusterInterface, CategorizeInboxListItemType } from '@budgie/categorization';

interface Props {
    readonly headers: Exclude<CategorizeInboxListItemType, CategorizeInboxClusterInterface>[];
}

export const CategorizeInboxComposition = ({ headers }: Props) => (
    <View className="gap-y-xl">
        <View className="flex-row gap-x-xs" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {headers.map(header => {
                const segmentStyle = { flexGrow: header.count, flexBasis: 0 };

                return (
                    <View
                        key={header.key}
                        className={cn('h-[6px] rounded-full', CATEGORIZE_INBOX_SECTION_ACCENT[header.section])}
                        style={segmentStyle}
                    />
                );
            })}
        </View>

        <View className="flex-row flex-wrap gap-x-3xl gap-y-md">
            {headers.map(header => (
                <CategorizeInboxLegendItem key={header.key} section={header.section} count={header.count} />
            ))}
        </View>
    </View>
);
