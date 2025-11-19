import { CategoryEntityInterface } from '@budgie/contracts';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedFlatList } from '../../../@generic/components/animated-flat-list/animated-flat-list';
import { DeletableRow } from '../../../@generic/components/deletable-row/deletable-row';
import { categoryRepository } from '../../../@generic/drizzle/db/db';
import { useVibration } from '../../../@generic/hooks/use-vibration.hook';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { CategoryCard } from '../category-card/category-card';
import { CategoryFormBottomSheet } from '../category-form-bottom-sheet/category-form-bottom-sheet';

interface Props {
    categories: CategoryEntityInterface[];
}

const safeEdges = ['bottom'] as const;
const listFooter = <SafeAreaView edges={safeEdges} />;

export const CategoriesList = ({ categories }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const [category, setCategory] = useState<CategoryEntityInterface | null>(null);

    const handleOpenCategory = (category: CategoryEntityInterface) => {
        setCategory(category);
        void ref.current?.open();
    };
    const [notify] = useVibration();

    const handleDeleteCategory = async (id: number) => {
        await categoryRepository.deleteById(id);
        notify(NotificationFeedbackType.Success);
    };

    const renderItem = (category: CategoryEntityInterface) => (
        <DeletableRow id={category.id} onDelete={handleDeleteCategory}>
            <CategoryCard onOpen={handleOpenCategory} category={category} />
        </DeletableRow>
    );

    const keyExtractor = (category: CategoryEntityInterface) => category.id.toString();

    const style = { paddingTop: 30, rowGap: 20 };

    return (
        <>
            <AnimatedFlatList
                className="flex-1"
                data={categories}
                contentContainerStyle={style}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                listFooterComponent={listFooter}
            />

            <CategoryFormBottomSheet category={category} ref={ref} />
        </>
    );
};
