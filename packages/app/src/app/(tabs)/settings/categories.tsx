import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { useCreateAction } from '../../../@generic/hook/use-create-action.hook';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { CategoryCard } from '../../../category/components/category-card/category-card';
import { CategoryDefaultIconButton } from '../../../category/components/category-default-icon-button/category-default-icon-button';
import { CategoryEmptyState } from '../../../category/components/category-empty-state/category-empty-state';
import { useCategoryFormModal } from '../../../category/context/category-form-modal.context';
import { useDeleteCategory } from '../../../category/hooks/use-delete-category.hook';
import { useSearchCategoriesQuery } from '../../../category/query/use-search-categories.query';

import { CategoryPageSelector } from './category-page.selector';

const handleGoBack = () => void goBackOrReplace('/settings');

export default function Categories() {
    const { t } = useLingui();
    const [openCategoryForm] = useCategoryFormModal();

    const [search, setSearch] = useState('');
    const handleDeleteCategory = useDeleteCategory();
    const { categories } = useSearchCategoriesQuery(search, false);

    useCreateAction({
        icon: UserIconNameEnum.Folder,
        label: t`Category`,
        variant: 'primary',
        onPress: () => void openCategoryForm()
    });

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
            listHeader={<CategoryDefaultIconButton />}
        />
    );
}
