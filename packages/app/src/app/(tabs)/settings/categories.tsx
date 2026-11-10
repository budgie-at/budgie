import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { EntitySearchableList } from '../../../@generic/component/entity-searchable-list/entity-searchable-list';
import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { UsageFailureRow } from '../../../@generic/component/usage-failure-row/usage-failure-row';
import { useCreateAction } from '../../../@generic/hook/use-create-action.hook';
import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { CategoryCard } from '../../../category/components/category-card/category-card';
import { CategoryEmptyState } from '../../../category/components/category-empty-state/category-empty-state';
import { CategoryFamilySection } from '../../../category/components/category-family-section/category-family-section';
import { CategoryListHeader } from '../../../category/components/category-list-header/category-list-header';
import { useCategoriesWithUsageQuery } from '../../../category/query/use-categories-with-usage.query';
import { goBackToSettings } from '../../../settings/utils/go-back-to-settings.util';

import { CategoryPageSelector } from './category-page.selector';

import type { EntityUsageInterface } from '../../../@generic/interface/entity-usage.interface';

const UNUSED: EntityUsageInterface = { transactionCount: 0, lastUsedAt: null };

export default function Categories() {
    const { t } = useLingui();
    const openCategoryForm = useOpenModal('/category-form');

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
    const handleCreateFromSearch = (defaultTitle: string) => void openCategoryForm({ defaultTitle });

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
            <EntitySearchableList
                data={categories}
                isFailure={isFailure}
                onRetry={retry}
                emptyState={<CategoryEmptyState search={search} onClearSearch={handleClearSearch} onCreate={handleCreateFromSearch} />}
                renderCard={renderCard}
                listHeader={<CategoryListHeader>{isUsageFailure ? <UsageFailureRow onRetry={retryUsage} /> : null}</CategoryListHeader>}
                listFooter={<CategoryFamilySection search={search} onOpen={handleOpenCategory} />}
            />
        </SearchablePage>
    );
}
