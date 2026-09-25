import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CategorizeInboxSectionEnum } from '../../enum/categorize-inbox-section.enum';

interface Props {
    readonly section: CategorizeInboxSectionEnum;
    readonly count: number;
}

export const CategorizeInboxSectionHeader = ({ section, count }: Props) => {
    const { t } = useLingui();

    const sectionTitles: Record<CategorizeInboxSectionEnum, string> = {
        [CategorizeInboxSectionEnum.CONFIDENT]: t`Ready to accept`,
        [CategorizeInboxSectionEnum.TRANSFERS]: t`Transfers`,
        [CategorizeInboxSectionEnum.REVIEW]: t`Needs your review`,
        [CategorizeInboxSectionEnum.ONE_OFFS]: t`One-offs`
    };

    return (
        <View className="flex-row items-center gap-x-sm pt-md">
            <Text className="text-secondary-foreground uppercase text-xs font-medium">{sectionTitles[section]}</Text>
            <Text className="text-secondary-foreground/60 text-xs">{count}</Text>
        </View>
    );
};
