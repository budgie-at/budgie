import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { CategorySelectorModalSelector } from '../../../app/category-selector-modal.selector';

interface Props {
    readonly onPress: () => void;
}

export const CategoryCreateRow = ({ onPress }: Props) => {
    const { t } = useLingui();
    const title = <Text className="text-[17px] text-primary" maxFontSizeMultiplier={1.35}>{t`Create category`}</Text>;

    return <GroupedListRow title={title} onPress={onPress} testID={CategorySelectorModalSelector.CreateButton} />;
};
