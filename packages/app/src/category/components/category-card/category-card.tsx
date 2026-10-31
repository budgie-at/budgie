import { CategoryEntityInterface, isEmojiIcon } from '@budgie/contracts';
import { View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { EntityListRow } from '../../../@generic/component/entity-list-row/entity-list-row';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { useMergeCategory } from '../../hooks/use-merge-category.hook';

import { CategoryCardSelector } from './category-card.selector';

import type { EntityUsageInterface } from '../../../@generic/interface/entity-usage.interface';

interface Props {
    readonly category: CategoryEntityInterface;
    readonly usage: EntityUsageInterface | undefined;
    readonly isFirst: boolean;
    readonly isLast: boolean;
    readonly onOpen: (category: CategoryEntityInterface) => void;
}

export const CategoryCard = ({ onOpen, category, usage, isFirst, isLast }: Props) => {
    const mergeCategory = useMergeCategory();
    const handleOpen = () => void onOpen(category);
    const handleMerge = () => mergeCategory(category.id);
    const iconSize = isEmojiIcon(category.icon) ? 22 : 18;

    return (
        <EntityListRow
            testID={CategoryCardSelector.Card(category.title)}
            left={
                <View testID={CategoryCardSelector.Icon(category.title, category.icon)} accessibilityElementsHidden>
                    <CircleIcon
                        icon={category.icon}
                        variant="secondary"
                        size={36}
                        iconSize={iconSize}
                        radius={18}
                        border={false}
                        className={TONAL_DISC_BACKGROUND.secondary}
                    />
                </View>
            }
            title={category.title}
            usage={usage}
            onOpen={handleOpen}
            onMerge={handleMerge}
            isFirst={isFirst}
            isLast={isLast}
        />
    );
};
