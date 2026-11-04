import { CategoryEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { EntityListRow } from '../../../@generic/component/entity-list-row/entity-list-row';
import { useDeleteCategory } from '../../hooks/use-delete-category.hook';
import { getCategoryDisplayIcon } from '../../utils/get-category-display-icon.util';
import { CategoryIconDisc } from '../category-icon-disc/category-icon-disc';

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
    const handleOpen = () => void onOpen(category);
    const icon = getCategoryDisplayIcon(category);
    const operations: EntityRowOperationsInterface = {
        deleteLabel: isPositiveNumber(usage?.transactionCount) ? t`Move transactions and delete…` : t`Delete…`,
        onDelete: trackMutation => deleteCategory(category.id, trackMutation)
    };

    return (
        <EntityListRow
            testID={CategoryCardSelector.Card(category.title)}
            entity={category}
            left={
                <View testID={CategoryCardSelector.Icon(category.title, icon)} accessibilityElementsHidden>
                    <CategoryIconDisc category={category} />
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
