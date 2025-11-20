import { CategoryEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { DeletableRow } from '../../@generic/components/deletable-row/deletable-row';
import { SearchablePage } from '../../@generic/components/searchable-page/searchable-page';
import { categoryRepository } from '../../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../../@generic/interface/bottom-sheet.interface';
import { CategoryCard } from '../../category/components/category-card/category-card';
import { CategoryFormBottomSheet } from '../../category/components/category-form-bottom-sheet/category-form-bottom-sheet';
import { useGetCategoriesLiveQuery } from '../../category/query/use-get-categories.live-query';

export default function Categories() {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const { categories } = useGetCategoriesLiveQuery(search, false);

    const handleDeleteCategory = async (id: number) => {
        await categoryRepository.deleteById(id);
    };

    const renderCard = (category: CategoryEntityInterface, onOpen: (category: CategoryEntityInterface) => void) => (
        <DeletableRow id={category.id} onDelete={handleDeleteCategory}>
            <CategoryCard onOpen={onOpen} category={category} />
        </DeletableRow>
    );

    const renderBottomSheet = (category: CategoryEntityInterface | null, ref: RefObject<BottomSheetInterface | null>) => <CategoryFormBottomSheet ref={ref} category={category} />

    const icon = isNotEmptyString(search) ? 'Search' : 'Folder';
    const title = isNotEmptyString(search) ? t`No Results` : t`No Custom Categories`;
    const description = isNotEmptyString(search) ? t`No categories match your search` : t`Custom categories you create will appear here`;

    return (
        <SearchablePage
            onDelete={handleDeleteCategory}
            title={t`Categories`}
            searchPlaceholder={t`Search categories...`}
            data={categories}
            renderBottomSheet={renderBottomSheet}
            renderCard={renderCard}
            search={search}
            onSearchChange={setSearch}
            emptyStateTitle={title}
            emptyStateIcon={icon}
            emptyStateDescription={description}
        />
    );
}
