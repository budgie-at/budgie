import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { categoryRepository } from '../../../@generic/drizzle/db/db';
import { useCreateAction } from '../../../@generic/hook/use-create-action.hook';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { CategoryCard } from '../../../category/components/category-card/category-card';
import { CategoryFormBottomSheet } from '../../../category/components/category-form-bottom-sheet/category-form-bottom-sheet';
import { useSearchCategoriesQuery } from '../../../category/query/use-search-categories.query';

export default function Categories() {
    const { t } = useLingui();

    const bottomSheetRef = useRef<BottomSheetInterface | null>(null);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<CategoryEntityInterface | null>(null);
    const { categories } = useSearchCategoriesQuery(search, false);

    const handleOpenCreate = () => {
        setSelectedCategory(null);
        void bottomSheetRef.current?.open();
    };

    useCreateAction({
        icon: UserIconNameEnum.Folder,
        label: t`Category`,
        variant: 'primary',
        onPress: handleOpenCreate
    });

    const handleDeleteCategory = async (id: number) => {
        await categoryRepository.deleteById(id);
    };

    const handleOpenCategory = (category: CategoryEntityInterface) => {
        setSelectedCategory(category);
        void bottomSheetRef.current?.open();
    };

    const renderCard = (category: CategoryEntityInterface) => <CategoryCard onOpen={handleOpenCategory} category={category} />;

    const icon = isNotEmptyString(search) ? UserIconNameEnum.Search : UserIconNameEnum.Folder;
    const title = isNotEmptyString(search) ? t`No Results` : t`No Custom Categories`;
    const description = isNotEmptyString(search) ? t`No categories match your search` : t`Custom categories you create will appear here`;

    const handleGoBack = () => void goBackOrReplace('/settings');

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
            emptyStateTitle={title}
            emptyStateIcon={icon}
            emptyStateDescription={description}
        >
            <CategoryFormBottomSheet ref={bottomSheetRef} category={selectedCategory} />
        </SearchablePage>
    );
}
