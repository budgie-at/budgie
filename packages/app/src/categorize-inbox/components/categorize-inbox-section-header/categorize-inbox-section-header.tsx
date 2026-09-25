import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CategorizeInboxSectionEnum } from '../../enum/categorize-inbox-section.enum';

interface Props {
    readonly section: CategorizeInboxSectionEnum;
    readonly count: number;
}

export const CategorizeInboxSectionHeader = ({ section, count }: Props) => {
    const { t } = useLingui();

    const sectionTitles: [CategorizeInboxSectionEnum, string][] = [
        [CategorizeInboxSectionEnum.CONFIDENT, t`Ready to accept`],
        [CategorizeInboxSectionEnum.TRANSFERS, t`Transfers`],
        [CategorizeInboxSectionEnum.REVIEW, t`Needs your review`],
        [CategorizeInboxSectionEnum.ONE_OFFS, t`One-offs`]
    ];
    const title = sectionTitles.find(([sectionValue]) => sectionValue === section)?.[1] ?? '';

    return (
        <View className="bg-primary-reverse py-sm flex-row items-center justify-between">
            <Text className="text-secondary-foreground uppercase text-xs">{title}</Text>
            <Text className="text-secondary-foreground text-xs">{count}</Text>
        </View>
    );
};
