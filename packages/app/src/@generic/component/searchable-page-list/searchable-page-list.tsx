import { LegendList } from '@legendapp/list';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { ReactNode } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import {
    LEGEND_LIST_CONTENT_GAP,
    LEGEND_LIST_ESTIMATED_ITEM_SIZE,
    LEGEND_LIST_HEADER_HEIGHT,
    LEGEND_LIST_STYLE,
    legendListKeyExtractor
} from '../../constant/legend-list.constant';
import { useVibration } from '../../hook/use-vibration.hook';
import { IdInterface } from '../../interface/id-interface.type';
import { DeletableRow } from '../deletable-row/deletable-row';

import { SEARCHABLE_LIST_CONTENT_PADDING_BOTTOM, SEARCHABLE_LIST_FOOTER_HEIGHT } from './searchable-page-list.constant';

import type { DeleteConfirmation } from '../deletable-row/deletable-row';

interface Props<T extends IdInterface> {
    data: T[];
    onDelete?: (id: number) => Promise<void>;
    renderCard: (item: T) => ReactNode;
    getDeleteConfirmation?: (item: T) => DeleteConfirmation | undefined;
    children?: ReactNode;
}

const CONTENT_CONTAINER_STYLE = { gap: LEGEND_LIST_CONTENT_GAP, paddingBottom: SEARCHABLE_LIST_CONTENT_PADDING_BOTTOM };

const HEADER_SPACER_STYLE = { height: LEGEND_LIST_HEADER_HEIGHT };
const FOOTER_SPACER_STYLE = { height: SEARCHABLE_LIST_FOOTER_HEIGHT };

const listHeader = <View style={HEADER_SPACER_STYLE} />;
const listFooter = <View style={FOOTER_SPACER_STYLE} />;

export const SearchablePageList = <T extends IdInterface>({ data, onDelete, renderCard, getDeleteConfirmation, children }: Props<T>) => {
    const [notify] = useVibration();

    const handleDeleteItem = async (id: number) => {
        if (!isDefined(onDelete)) {
            return;
        }

        const isDeleted = await onDelete(id)
            .then(() => true)
            .catch(() => false);

        if (isDeleted) {
            notify(NotificationFeedbackType.Success);
        }
    };

    const renderItem = ({ item }: { item: T }) => {
        const card = renderCard(item);
        if (!isDefined(onDelete)) {
            return card;
        }

        const confirmation = getDeleteConfirmation?.(item);

        return (
            <DeletableRow id={item.id} onDelete={handleDeleteItem} {...(isDefined(confirmation) && { confirmation })}>
                {card}
            </DeletableRow>
        );
    };

    return (
        <>
            <LegendList
                style={LEGEND_LIST_STYLE}
                data={data}
                contentContainerStyle={CONTENT_CONTAINER_STYLE}
                ListHeaderComponent={listHeader}
                renderItem={renderItem}
                keyExtractor={legendListKeyExtractor}
                estimatedItemSize={LEGEND_LIST_ESTIMATED_ITEM_SIZE}
                recycleItems
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                ListFooterComponent={listFooter}
            />

            {children}
        </>
    );
};
