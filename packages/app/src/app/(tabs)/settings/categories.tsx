/* jscpd:ignore-start */
import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import Toast from 'react-native-toast-message';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { DeletableRow } from '../../../@generic/component/deletable-row/deletable-row';
import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { useCreateAction } from '../../../@generic/hook/use-create-action.hook';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { CategoryCard } from '../../../category/components/category-card/category-card';
import { CategoryEmptyState } from '../../../category/components/category-empty-state/category-empty-state';
import { CategoryFormBottomSheet } from '../../../category/components/category-form-bottom-sheet/category-form-bottom-sheet';
import { CategorySelectorBottomSheet } from '../../../category/components/category-selector-bottom-sheet/category-selector-bottom-sheet';
import { useSearchCategoriesQuery } from '../../../category/query/use-search-categories.query';
import { categoryService } from '../../../category/service/category.service';

const handleGoBack = () => void goBackOrReplace('/settings');

export default function Categories() {
    const { t } = useLingui();

    const bottomSheetRef = useRef<BottomSheetInterface | null>(null);
    const reassignRef = useRef<BottomSheetInterface | null>(null);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<CategoryEntityInterface | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<CategoryEntityInterface | null>(null);
    const { categories } = useSearchCategoriesQuery(search, false);

    const excludeCategoryIds = isDefined(categoryToDelete) ? [categoryToDelete.id] : [];

    useCreateAction({
        icon: UserIconNameEnum.Folder,
        label: t`Category`,
        variant: 'primary',
        onPress: () => {
            setSelectedCategory(null);
            void bottomSheetRef.current?.open();
        }
    });

    const handleDeleteCategory = async (id: number) => {
        const count = await categoryService.countTransactionEntries(id);
        if (isPositiveNumber(count)) {
            const category = categories.find(cat => cat.id === id);
            if (isDefined(category)) {
                setCategoryToDelete(category);
                void reassignRef.current?.open();
            }

            return;
        }
        await categoryService.deleteById(id);
    };

    const handleReassignSelect = async (targetCategoryId: number | null) => {
        if (isDefined(categoryToDelete) && isDefined(targetCategoryId)) {
            try {
                await categoryService.mergeInto(categoryToDelete.id, targetCategoryId);
                void reassignRef.current?.close();
                setCategoryToDelete(null);
            } catch {
                Toast.show({
                    type: 'error',
                    text1: t`Could not reassign category`,
                    text2: t`Please try again later`
                });
            }
        }
    };

    const handleOpenCategory = (category: CategoryEntityInterface) => {
        setSelectedCategory(category);
        void bottomSheetRef.current?.open();
    };

    const renderCard = (category: CategoryEntityInterface) => (
        <DeletableRow id={category.id} onDelete={handleDeleteCategory}>
            <CategoryCard onOpen={handleOpenCategory} category={category} />
        </DeletableRow>
    );

    return (
        <SearchablePage
            onGoBack={handleGoBack}
            title={t`Categories`}
            searchPlaceholder={t`Search categories...`}
            data={categories}
            renderCard={renderCard}
            search={search}
            onSearchChange={setSearch}
            emptyState={<CategoryEmptyState search={search} />}
        >
            <CategoryFormBottomSheet ref={bottomSheetRef} category={selectedCategory} />

            <CategorySelectorBottomSheet
                ref={reassignRef}
                selectedCategory={null}
                excludeCategoryIds={excludeCategoryIds}
                description={t`This category has transactions. Select another category to reassign them to.`}
                variant="primary"
                onSelect={handleReassignSelect}
            />
        </SearchablePage>
    );
}
/* jscpd:ignore-end */
