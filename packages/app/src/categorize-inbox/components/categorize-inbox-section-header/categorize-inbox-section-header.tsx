import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CategorizeInboxSectionEnum } from '../../enum/categorize-inbox-section.enum';

interface Props {
    readonly section: CategorizeInboxSectionEnum;
    readonly rowCount: number;
}

export const CategorizeInboxSectionHeader = ({ section, rowCount }: Props) => {
    const { t } = useLingui();

    const sectionTitles: Record<CategorizeInboxSectionEnum, string> = {
        [CategorizeInboxSectionEnum.CONFIDENT]: t`Ready to accept`,
        [CategorizeInboxSectionEnum.TRANSFERS]: t`Transfers`,
        [CategorizeInboxSectionEnum.REVIEW]: t`Needs review`,
        [CategorizeInboxSectionEnum.ONE_OFFS]: t`One-offs`
    };

    return (
        <View className="flex-row items-center justify-between py-md">
            <Text className="text-secondary-foreground uppercase text-xs">{sectionTitles[section]}</Text>
            <Text className="text-secondary-foreground text-xs">{rowCount}</Text>
        </View>
    );
};
