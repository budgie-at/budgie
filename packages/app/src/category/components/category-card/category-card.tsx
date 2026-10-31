import { CategoryEntityInterface, isEmojiIcon } from '@budgie/contracts';
import { View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListItem } from '../../../@generic/component/grouped-list-item/grouped-list-item';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { useFormatEntityUsage } from '../../../@generic/hook/use-format-entity-usage.hook';
import { useCategoryUsageQuery } from '../../query/use-category-usage.query';

import { CategoryCardSelector } from './category-card.selector';

interface Props {
    readonly category: CategoryEntityInterface;
    readonly isFirst: boolean;
    readonly isLast: boolean;
    readonly onOpen: (category: CategoryEntityInterface) => void;
}

export const CategoryCard = ({ onOpen, category, isFirst, isLast }: Props) => {
    const formatUsage = useFormatEntityUsage();
    const usage = useCategoryUsageQuery(category.id);
    const handleOpen = () => void onOpen(category);
    const iconSize = isEmojiIcon(category.icon) ? 22 : 18;

    return (
        <GroupedListItem isFirst={isFirst} isLast={isLast}>
            <GroupedListRow
                testID={CategoryCardSelector.Card(category.title)}
                left={
                    <View testID={CategoryCardSelector.Icon(category.title, category.icon)} accessibilityElementsHidden>
                        <CircleIcon
                            icon={category.icon}
                            variant="default"
                            size={36}
                            iconSize={iconSize}
                            radius={18}
                            border={false}
                            className={TONAL_DISC_BACKGROUND.default}
                        />
                    </View>
                }
                title={category.title}
                subtitle={formatUsage(usage)}
                onPress={handleOpen}
            />
        </GroupedListItem>
    );
};
