import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { SearchablePageErrorState } from '../../../@generic/component/searchable-page-error-state/searchable-page-error-state';
import { SearchablePageList } from '../../../@generic/component/searchable-page-list/searchable-page-list';
import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { UsageFailureRow } from '../../../@generic/component/usage-failure-row/usage-failure-row';
import { useCreateAction } from '../../../@generic/hook/use-create-action.hook';
import { CategoryCard } from '../../../category/components/category-card/category-card';
import { CategoryEmptyState } from '../../../category/components/category-empty-state/category-empty-state';
import { CategoryListHeader } from '../../../category/components/category-list-header/category-list-header';
import { useCategoryFormModal } from '../../../category/context/category-form-modal.context';
import { useCategoriesWithUsageQuery } from '../../../category/query/use-categories-with-usage.query';
import { goBackToSettings } from '../../../settings/utils/go-back-to-settings.util';

import { CategoryPageSelector } from './category-page.selector';

import type { EntityUsageInterface } from '../../../@generic/interface/entity-usage.interface';

const NO_CATEGORIES: CategoryEntityInterface[] = [];
const UNUSED: EntityUsageInterface = { transactionCount: 0, lastUsedAt: null };

export default function Categories() {
    const { t } = useLingui();
    const [openCategoryForm] = useCategoryFormModal();

    const [search, setSearch] = useState('');
    const { categories, usage, isUsageFailure, retryUsage, isFailure, retry } = useCategoriesWithUsageQuery(search, false);

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

    const listData = isFailure ? NO_CATEGORIES : categories;
    const emptyState = isFailure ? (
        <SearchablePageErrorState onRetry={retry} />
    ) : (
        <CategoryEmptyState search={search} onClearSearch={handleClearSearch} />
    );

    const renderCard = (category: CategoryEntityInterface, index: number, isLast: boolean) => {
        const categoryUsage = isDefined(usage) ? (usage.find(entry => entry.id === category.id) ?? UNUSED) : void 0;

        return (
            <CategoryCard
                key={category.id}
                onOpen={handleOpenCategory}
                category={category}
                usage={categoryUsage}
                isFirst={index === 0}
                isLast={isLast}
            />
        );
    };

    return (
        <SearchablePage
            title={t`Categories`}
            onGoBack={goBackToSettings}
            search={search}
            searchPlaceholder={t`Search custom categories…`}
            onSearchChange={setSearch}
            searchInputTestID={CategoryPageSelector.SearchInput}
        >
            <SearchablePageList
                data={listData}
                emptyState={emptyState}
                renderCard={renderCard}
                listHeader={<CategoryListHeader>{isUsageFailure ? <UsageFailureRow onRetry={retryUsage} /> : null}</CategoryListHeader>}
                gap={0}
            />
        </SearchablePage>
    );
}
