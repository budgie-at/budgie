import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useIconSearchEntries } from '../../../@generic/hook/use-icon-search-entries.hook';
import { useSearchCategoriesQuery } from '../../query/use-search-categories.query';
import { needsIconChoice } from '../../utils/needs-icon-choice.util';

import { CategoryDefaultIconButtonSelector } from './category-default-icon-button.selector';

export const CategoryDefaultIconButton = () => {
    const { t } = useLingui();
    const router = useRouter();
    const { categories } = useSearchCategoriesQuery('', false);
    const iconSearchEntries = useIconSearchEntries();

    const count = (categories ?? []).filter(category => needsIconChoice(category, iconSearchEntries)).length;

    const handlePress = () => void router.push('/settings/category-icons');

    if (!isPositiveNumber(count)) {
        return null;
    }

    return (
        <View className="pb-3xl">
            <GroupedListSection>
                <GroupedListRow
                    testID={CategoryDefaultIconButtonSelector.Button}
                    left={
                        <CircleIcon icon={UserIconNameEnum.Sparkles} variant="ghost" size={36} iconSize={18} radius={18} border={false} />
                    }
                    title={t({ message: plural(count, { one: 'Choose an icon for # category', other: 'Choose icons for # categories' }) })}
                    subtitle={t({
                        message: plural(count, {
                            one: 'It still has a placeholder icon',
                            other: 'They still have placeholder icons'
                        })
                    })}
                    onPress={handlePress}
                />
            </GroupedListSection>
        </View>
    );
};
