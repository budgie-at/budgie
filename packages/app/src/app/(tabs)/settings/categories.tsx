/* jscpd:ignore-start */
import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { useCreateAction } from '../../../@generic/hook/use-create-action.hook';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { CategoryCard } from '../../../category/components/category-card/category-card';
import { CategoryEmptyState } from '../../../category/components/category-empty-state/category-empty-state';
import { useCategoryFormModal } from '../../../category/context/category-form-modal.context';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { useSearchCategoriesQuery } from '../../../category/query/use-search-categories.query';
import { categoryService } from '../../../category/service/category.service';

import { CategoryPageSelector } from './category-page.selector';

const handleGoBack = () => void goBackOrReplace('/settings');

export default function Categories() {
    const { t } = useLingui();
    const [openCategorySelector] = useCategorySelectorModal();
    const [openCategoryForm] = useCategoryFormModal();

    const [search, setSearch] = useState('');
    const { categories } = useSearchCategoriesQuery(search, false);

    useCreateAction({
        icon: UserIconNameEnum.Folder,
        label: t`Category`,
        variant: 'primary',
        onPress: () => void openCategoryForm()
    });

    const handleDeleteCategory = async (id: number) => {
        const count = await categoryService.countTransactionEntries(id);
        if (isPositiveNumber(count)) {
            const description = t({
                message: plural(count, {
                    one: 'This category has # transaction. Select another category to reassign it to.',
                    other: 'This category has # transactions. Select another category to reassign them to.'
                })
            });
            const targetCategoryId = await openCategorySelector({
                excludeCategoryIds: [id],
                description,
                variant: 'primary'
            });

            if (isDefined(targetCategoryId)) {
                try {
                    await categoryService.mergeInto(id, targetCategoryId);
                } catch {
                    Toast.show({
                        type: 'error',
                        text1: t`Could not reassign category`,
                        text2: t`Please try again later`
                    });
                }
            }

            return;
        }

        try {
            await categoryService.deleteById(id);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: t`Could not delete category`,
                text2: t`Please try again later`
            });

            throw error;
        }
    };

    const handleOpenCategory = (category: CategoryEntityInterface) => {
        void openCategoryForm({ category });
    };

    const renderCard = (category: CategoryEntityInterface) => <CategoryCard onOpen={handleOpenCategory} category={category} />;

    return (
        <SearchablePage
            onGoBack={handleGoBack}
            onDelete={handleDeleteCategory}
            title={t`Categories`}
            searchPlaceholder={t`Search categories...`}
            data={categories}
            renderCard={renderCard}
            search={search}
            onSearchChange={setSearch}
            searchInputTestID={CategoryPageSelector.SearchInput}
            emptyState={<CategoryEmptyState search={search} />}
        />
    );
}
/* jscpd:ignore-end */
