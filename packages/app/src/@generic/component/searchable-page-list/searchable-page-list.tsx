import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { ReactNode } from 'react';

import { useVibration } from '../../hook/use-vibration.hook';
import { IdInterface } from '../../interface/id.interface';
import { AnimatedFlatList } from '../animated-flat-list/animated-flat-list';
import { DeletableRow } from '../deletable-row/deletable-row';
import { MenuSpacer } from '../menu-spacer/menu-spacer';

interface Props<T extends IdInterface> {
    data: T[];
    onDelete: (id: number) => Promise<void>;
    renderCard: (item: T) => ReactNode;
    children?: ReactNode;
}

const keyExtractor = (item: IdInterface) => item.id.toString();

export const SearchablePageList = <T extends IdInterface>({ data, onDelete, renderCard, children }: Props<T>) => {
    const [notify] = useVibration();

    const handleDeleteItem = async (id: number) => {
        await onDelete(id);
        notify(NotificationFeedbackType.Success);
    };

    const renderItem = (item: T) => (
        <DeletableRow id={item.id} onDelete={handleDeleteItem}>
            {renderCard(item)}
        </DeletableRow>
    );

    return (
        <>
            <AnimatedFlatList
                className="flex-1"
                data={data}
                contentContainerClassName="gap-y-5xl pt-5xl"
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                ListFooterComponent={MenuSpacer}
            />

            {children}
        </>
    );
};
