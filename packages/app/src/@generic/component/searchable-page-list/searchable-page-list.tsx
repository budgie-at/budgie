import { AnimatedLegendList } from '@legendapp/list/reanimated';
import * as Effect from 'effect/Effect';
import { NotificationFeedbackType } from 'expo-haptics';
import { ReactElement, ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { isDefined } from '@rnw-community/shared';

import {
    LEGEND_LIST_CONTENT_GAP,
    LEGEND_LIST_HEADER_HEIGHT,
    LEGEND_LIST_STYLE,
    legendListKeyExtractor
} from '../../constant/legend-list.constant';
import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../constant/screen-chrome-content-inset.constant';
import { useVibration } from '../../hook/use-vibration.hook';
import { IdInterface } from '../../interface/id.interface';
import { appRuntime } from '../../runtime/app.runtime';
import { logAndContinue } from '../../utils/log-and-continue.util';
import { DeletableRow } from '../deletable-row/deletable-row';

import type { LegendListSizingInterface } from '../../interface/legend-list-sizing.interface';
import type { DeleteItemEffectType } from '../../type/delete-item-effect.type';
import type { DeleteConfirmation } from '../deletable-row/deletable-row';

interface Props<T extends IdInterface> {
    data: T[];
    onDelete?: DeleteItemEffectType;
    renderCard: (item: T, index: number) => ReactNode;
    getDeleteConfirmation?: (item: T) => DeleteConfirmation | undefined;
    listHeader?: ReactElement | null;
    estimatedHeaderSize?: number;
    children?: ReactNode;
    sizing?: LegendListSizingInterface<T>;
}

const FOOTER_SPACER_STYLE = { height: 330 };
const MAINTAIN_VISIBLE_CONTENT_POSITION = { data: false, size: true };

const listFooter = <View style={FOOTER_SPACER_STYLE} />;

export const SearchablePageList = <T extends IdInterface>({
    data,
    onDelete,
    renderCard,
    getDeleteConfirmation,
    listHeader: customListHeader,
    estimatedHeaderSize = LEGEND_LIST_HEADER_HEIGHT,
    children,
    sizing
}: Props<T>) => {
    const [notify] = useVibration();
    const { scrollY } = useCollapsibleHeaderScroll();
    const insets = useSafeAreaInsets();
    const contentContainerStyle = {
        gap: LEGEND_LIST_CONTENT_GAP,
        paddingTop: insets.top + SCREEN_CHROME_CONTENT_INSET_TOP,
        paddingBottom: 220
    };

    const handleDeleteItem = (id: number) => {
        if (!isDefined(onDelete)) {
            return;
        }

        appRuntime.runFork(
            logAndContinue(onDelete(id).pipe(Effect.tap(() => Effect.sync(() => void notify(NotificationFeedbackType.Success)))))
        );
    };

    const renderItem = ({ item, index }: { item: T; index: number }) => {
        const card = renderCard(item, index);
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

    const sharedValues = { scrollOffset: scrollY };

    return (
        <>
            <AnimatedLegendList
                style={LEGEND_LIST_STYLE}
                data={data}
                contentContainerStyle={contentContainerStyle}
                ListHeaderComponent={customListHeader}
                estimatedHeaderSize={estimatedHeaderSize}
                renderItem={renderItem}
                keyExtractor={legendListKeyExtractor}
                estimatedItemSize={sizing?.estimatedItemSize}
                getItemType={sizing?.getItemType}
                keyboardShouldPersistTaps="handled"
                ListFooterComponent={listFooter}
                sharedValues={sharedValues}
                recycleItems
                maintainVisibleContentPosition={MAINTAIN_VISIBLE_CONTENT_POSITION}
                showsVerticalScrollIndicator={false}
            />

            {children}
        </>
    );
};
