import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { SearchablePageList } from '../../../@generic/component/searchable-page-list/searchable-page-list';
import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { useCreateAction } from '../../../@generic/hook/use-create-action.hook';
import { CategoryCard } from '../../../category/components/category-card/category-card';
import { CategoryEmptyState } from '../../../category/components/category-empty-state/category-empty-state';
import { CategoryListHeader } from '../../../category/components/category-list-header/category-list-header';
import { useCategoryFormModal } from '../../../category/context/category-form-modal.context';
import { useDeleteCategory } from '../../../category/hooks/use-delete-category.hook';
import { useCustomCategoriesWithUsageQuery } from '../../../category/query/use-custom-categories-with-usage.query';
import { goBackToSettings } from '../../../settings/utils/go-back-to-settings.util';

import { CategoryPageSelector } from './category-page.selector';

export default function Categories() {
    const { t } = useLingui();
    const [openCategoryForm] = useCategoryFormModal();

    const [search, setSearch] = useState('');
    const handleDeleteCategory = useDeleteCategory();
    const { categories, usage } = useCustomCategoriesWithUsageQuery(search);

    useCreateAction({
        icon: UserIconNameEnum.Folder,
        label: t`Category`,
        variant: 'primary',
        onPress: () => void openCategoryForm()
    });

    const handleOpenCategory = (category: CategoryEntityInterface) => {
        openCategoryForm({ category });
    };

    const handleClearSearch = () => void setSearch('');

    const renderCard = (category: CategoryEntityInterface, index: number, isLast: boolean) => (
        <CategoryCard
            onOpen={handleOpenCategory}
            category={category}
            usage={usage?.find(entry => entry.id === category.id)}
            isFirst={index === 0}
            isLast={isLast}
        />
    );

    return (
        <SearchablePage
            title={t`Categories`}
            onGoBack={goBackToSettings}
            search={search}
            searchPlaceholder={t`Search custom categories...`}
            onSearchChange={setSearch}
            searchInputTestID={CategoryPageSelector.SearchInput}
        >
            <SearchablePageList
                data={categories}
                emptyState={<CategoryEmptyState search={search} onClearSearch={handleClearSearch} />}
                onDelete={handleDeleteCategory}
                renderCard={renderCard}
                listHeader={<CategoryListHeader />}
                gap={0}
            />
        </SearchablePage>
    );
}
