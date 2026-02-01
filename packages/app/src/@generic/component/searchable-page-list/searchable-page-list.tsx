import { LegendList } from '@legendapp/list';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { ReactNode } from 'react';
import { View } from 'react-native';

import { useVibration } from '../../hook/use-vibration.hook';
import { IdInterface } from '../../interface/id.interface';
import { DeletableRow } from '../deletable-row/deletable-row';

interface Props<T extends IdInterface> {
    data: T[];
    onDelete: (id: number) => Promise<void>;
    renderCard: (item: T) => ReactNode;
    children?: ReactNode;
}

const ESTIMATED_ITEM_SIZE = 60;
const LIST_STYLE = { flex: 1 };
const CONTENT_CONTAINER_STYLE = { gap: 12, paddingBottom: 200 };

const HEADER_SPACER_STYLE = { height: 80 };
const FOOTER_SPACER_STYLE = { height: 300 };

const keyExtractor = (item: IdInterface) => item.id.toString();

const listHeader = <View style={HEADER_SPACER_STYLE} />;
const listFooter = <View style={FOOTER_SPACER_STYLE} />;

export const SearchablePageList = <T extends IdInterface>({ data, onDelete, renderCard, children }: Props<T>) => {
    const [notify] = useVibration();

    const handleDeleteItem = async (id: number) => {
        await onDelete(id);
        notify(NotificationFeedbackType.Success);
    };

    const renderItem = ({ item }: { item: T }) => (
        <DeletableRow id={item.id} onDelete={handleDeleteItem}>
            {renderCard(item)}
        </DeletableRow>
    );

    return (
        <>
            <LegendList
                style={LIST_STYLE}
                data={data}
                contentContainerStyle={CONTENT_CONTAINER_STYLE}
                ListHeaderComponent={listHeader}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                estimatedItemSize={ESTIMATED_ITEM_SIZE}
                recycleItems
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                ListFooterComponent={listFooter}
            />

            {children}
        </>
    );
};
