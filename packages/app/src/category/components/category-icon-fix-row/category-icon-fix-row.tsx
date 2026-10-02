import { CategoryEntityInterface, UserIconType } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { IconSuggestions } from '../../../@generic/component/icon-suggestions/icon-suggestions';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { useCategoryFormModal } from '../../context/category-form-modal.context';
import { CategoryService } from '../../service/category.service';
import { getCategoryIconTerms } from '../../utils/get-category-icon-terms.util';

import { CategoryIconFixRowSelector } from './category-icon-fix-row.selector';

interface Props {
    readonly category: CategoryEntityInterface;
}

export const CategoryIconFixRow = ({ category }: Props) => {
    const { t } = useLingui();
    const [openCategoryForm] = useCategoryFormModal();

    const handleOpen = () => void openCategoryForm({ category });

    const handleSelect = (icon: UserIconType) => {
        appRuntime
            .runPromise(Effect.flatMap(CategoryService, categoryService => categoryService.updateIcon(category.id, icon)))
            .catch(() => void showErrorToast(t`Could not update category icon`, t`Please try again later`));
    };

    return (
        <View className="gap-y-md pb-xl">
            <SimpleHorizontalCell
                testID={CategoryIconFixRowSelector.Row(category.title)}
                left={<CircleIcon icon={category.icon} variant="default" size={42} iconSize={20} />}
                title={category.title}
                onPress={handleOpen}
                className="flex-row gap-x-xl items-center"
            />

            <IconSuggestions
                terms={getCategoryIconTerms(category)}
                limit={6}
                onSelect={handleSelect}
                testID={CategoryIconFixRowSelector.Suggestions(category.title)}
            />
        </View>
    );
};
