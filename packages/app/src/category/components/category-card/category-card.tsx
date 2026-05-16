import { CategoryEntityInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { resolveCategoryTitle } from '../../utils/resolve-category-title.util';

import { CategoryCardSelector } from './category-card.selector';

interface Props {
    readonly category: CategoryEntityInterface;
    readonly onOpen: (category: CategoryEntityInterface) => void;
}

export const CategoryCard = ({ onOpen, category }: Props) => {
    const { i18n } = useLingui();

    const handleOpen = () => void onOpen(category);
    const visibleTitle = resolveCategoryTitle(category, i18n) ?? category.title;
    const { isDefault } = category;
    const swipeLeftHint = isDefault ? null : (
        <Text className="text-secondary-foreground font-medium text-xs ml-auto">
            <Trans>Swipe left</Trans>
        </Text>
    );

    return (
        <SimpleHorizontalCell
            testID={CategoryCardSelector.Card(category.title)}
            left={
                <View testID={CategoryCardSelector.Icon(category.title, category.icon)}>
                    <CircleIcon icon={category.icon} variant="default" size={42} iconSize={20} />
                </View>
            }
            title={visibleTitle}
            right={swipeLeftHint}
            {...(!isDefault && { onPress: handleOpen })}
            className="flex-row gap-x-xl items-center"
        />
    );
};
