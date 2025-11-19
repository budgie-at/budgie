import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { ReactNode, RefObject, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useVibration } from '../../hooks/use-vibration.hook';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { IdInterface } from '../../interface/id.interface';
import { AnimatedFlatList } from '../animated-flat-list/animated-flat-list';
import { DeletableRow } from '../deletable-row/deletable-row';

interface Props<T extends IdInterface> {
    data: T[];
    onDelete: (id: number) => Promise<void>;
    renderCard: (item: T, onOpen: (item: T) => void) => ReactNode;
    renderBottomSheet: (item: T | null, ref: RefObject<BottomSheetInterface | null>) => ReactNode;
}

const safeEdges = ['bottom'] as const;
const listFooter = <SafeAreaView edges={safeEdges} />;

const keyExtractor = (item: IdInterface) => item.id.toString();

export const SearchablePageList = <T extends IdInterface>({ data, renderBottomSheet, onDelete, renderCard }: Props<T>) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const [selectedItem, setSelectedItem] = useState<T | null>(null);
    const [notify] = useVibration();

    const handleOpenItem = (item: T) => {
        setSelectedItem(item);
        void ref.current?.open();
    };

    const handleDeleteItem = async (id: number) => {
        await onDelete(id);
        notify(NotificationFeedbackType.Success);
    };

    const renderItem = (item: T) => (
        <DeletableRow id={item.id} onDelete={handleDeleteItem}>
            {renderCard(item, handleOpenItem)}
        </DeletableRow>
    );

    const style = { paddingTop: 30, rowGap: 20 };

    return (
        <>
            <AnimatedFlatList
                className="flex-1"
                data={data}
                contentContainerStyle={style}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                ListFooterComponent={listFooter}
            />

            {renderBottomSheet(selectedItem, ref)}
        </>
    );
};
