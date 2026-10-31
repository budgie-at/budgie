import { CategoryEntityInterface, isEmojiIcon } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { EntityListRow } from '../../../@generic/component/entity-list-row/entity-list-row';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { useDeleteCategory } from '../../hooks/use-delete-category.hook';
import { useMergeCategory } from '../../hooks/use-merge-category.hook';

import { CategoryCardSelector } from './category-card.selector';

import type { EntityRowOperationsInterface } from '../../../@generic/interface/entity-row-operations.interface';
import type { EntityUsageInterface } from '../../../@generic/interface/entity-usage.interface';

interface Props {
    readonly category: CategoryEntityInterface;
    readonly usage: EntityUsageInterface | undefined;
    readonly isFirst: boolean;
    readonly isLast: boolean;
    readonly onOpen: (category: CategoryEntityInterface) => void;
}

export const CategoryCard = ({ onOpen, category, usage, isFirst, isLast }: Props) => {
    const { t } = useLingui();
    const deleteCategory = useDeleteCategory();
    const mergeCategory = useMergeCategory();
    const handleOpen = () => void onOpen(category);
    const iconSize = isEmojiIcon(category.icon) ? 22 : 18;
    const operations: EntityRowOperationsInterface = {
        deleteLabel: isPositiveNumber(usage?.transactionCount) ? t`Move transactions and delete…` : t`Delete`,
        onMerge: trackMutation => mergeCategory(category.id, trackMutation),
        onDelete: trackMutation => deleteCategory(category.id, trackMutation)
    };

    return (
        <EntityListRow
            testID={CategoryCardSelector.Card(category.title)}
            entity={category}
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
            usage={usage}
            onOpen={handleOpen}
            operations={operations}
            isFirst={isFirst}
            isLast={isLast}
        />
    );
};
