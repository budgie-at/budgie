import { CategoryEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';

import { CategoryCardSelector } from './category-card.selector';

interface Props {
    category: CategoryEntityInterface;
    onOpen: (category: CategoryEntityInterface) => void;
}

export const CategoryCard = ({ onOpen, category }: Props) => {
    const handleOpen = () => void onOpen(category);

    return (
        <SimpleHorizontalCell
            testID={CategoryCardSelector.Card(category.title)}
            left={
                <View testID={CategoryCardSelector.Icon(category.title, category.icon)}>
                    <CircleIcon icon={category.icon} variant="default" size={42} iconSize={20} />
                </View>
            }
            title={category.title}
            right={
                <Text className="text-secondary-foreground font-medium text-xs ml-auto">
                    <Trans>Swipe left</Trans>
                </Text>
            }
            onPress={handleOpen}
            className="flex-row gap-x-xl items-center"
        />
    );
};
