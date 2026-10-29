import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { Text, View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { CATEGORIZE_INBOX_SECTION_ACCENT } from '../../constant/categorize-inbox-section-accent.constant';
import { CategorizeInboxSectionTitle } from '../categorize-inbox-section-title/categorize-inbox-section-title';

interface Props {
    readonly section: CategorizeInboxSectionEnum;
    readonly count: number;
}

export const CategorizeInboxLegendItem = ({ section, count }: Props) => (
    <View className="flex-row items-center gap-x-sm">
        <View className={cn('h-2 w-2 rounded-full', CATEGORIZE_INBOX_SECTION_ACCENT[section])} />
        <CategorizeInboxSectionTitle section={section} className="text-secondary-foreground text-xs" />
        <Text className="text-primary text-xs font-semibold tabular-nums">{count}</Text>
    </View>
);
