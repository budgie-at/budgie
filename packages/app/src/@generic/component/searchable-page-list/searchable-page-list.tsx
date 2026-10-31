import { AnimatedLegendList } from '@legendapp/list/reanimated';
import * as Effect from 'effect/Effect';
import { NotificationFeedbackType } from 'expo-haptics';
import { ReactElement, ReactNode } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../constant/floating-tab-bar.constant';
import {
    LEGEND_LIST_CONTENT_GAP,
    LEGEND_LIST_HEADER_HEIGHT,
    LEGEND_LIST_STYLE,
    legendListKeyExtractor
} from '../../constant/legend-list.constant';
import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../constant/screen-chrome-content-inset.constant';
import { useStickyDefinedValue } from '../../hook/use-sticky-defined-value.hook';
import { useVibration } from '../../hook/use-vibration.hook';
import { IdInterface } from '../../interface/id.interface';
import { appRuntime } from '../../runtime/app.runtime';
import { logAndContinue } from '../../utils/log-and-continue.util';
import { DeletableRow } from '../deletable-row/deletable-row';
import { LoadingContent } from '../loading-content/loading-content';
import { SEARCH_INPUT_VERTICAL_OFFSET, SEARCH_LIST_BOTTOM_CLEARANCE } from '../searchable-page/searchable-page.constant';

import type { LegendListSizingInterface } from '../../interface/legend-list-sizing.interface';
import type { AppServices } from '../../runtime/app.runtime';
import type { DeleteConfirmation } from '../deletable-row/deletable-row';

interface Props<T extends IdInterface> {
    data: T[] | null;
    emptyState: ReactNode;
    onDelete?: (id: number) => Effect.Effect<unknown, unknown, AppServices>;
    renderCard: (item: T, index: number, isLast: boolean) => ReactNode;
    getDeleteConfirmation?: (item: T) => DeleteConfirmation | undefined;
    listHeader?: ReactElement | null;
    sizing?: LegendListSizingInterface<T>;
    gap?: number;
}

const MAINTAIN_VISIBLE_CONTENT_POSITION = { data: false, size: true };

export const SearchablePageList = <T extends IdInterface>({
    data,
    emptyState,
    onDelete,
    renderCard,
    getDeleteConfirmation,
    listHeader: customListHeader,
    sizing,
    gap = LEGEND_LIST_CONTENT_GAP
}: Props<T>) => {
    const [notify] = useVibration();
    const { scrollY } = useCollapsibleHeaderScroll();
    const insets = useSafeAreaInsets();
    const items = useStickyDefinedValue(data);
    const paddingTop = insets.top + SCREEN_CHROME_CONTENT_INSET_TOP;
    const paddingBottom =
        FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN + insets.bottom - SEARCH_INPUT_VERTICAL_OFFSET + SEARCH_LIST_BOTTOM_CLEARANCE;

    if (!isNotEmptyArray(items)) {
        const emptyStateContainerStyle = { paddingTop, paddingBottom };

        return (
            <KeyboardAwareScrollView
                contentContainerStyle={emptyStateContainerStyle}
                bottomOffset={SEARCH_LIST_BOTTOM_CLEARANCE}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <LoadingContent isLoading={!isDefined(data)}>{emptyState}</LoadingContent>
            </KeyboardAwareScrollView>
        );
    }

    const lastIndex = items.length - 1;
    const contentContainerStyle = { gap, paddingTop, paddingBottom };

    const handleDeleteItem = (id: number) => {
        if (!isDefined(onDelete)) {
            return;
        }

        appRuntime.runFork(
            logAndContinue(onDelete(id).pipe(Effect.tap(() => Effect.sync(() => void notify(NotificationFeedbackType.Success)))))
        );
    };

    const renderItem = ({ item, index }: { item: T; index: number }) => {
        const card = renderCard(item, index, index === lastIndex);
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
        <AnimatedLegendList
            style={LEGEND_LIST_STYLE}
            data={items}
            contentContainerStyle={contentContainerStyle}
            ListHeaderComponent={customListHeader}
            estimatedHeaderSize={LEGEND_LIST_HEADER_HEIGHT}
            renderItem={renderItem}
            keyExtractor={legendListKeyExtractor}
            estimatedItemSize={sizing?.estimatedItemSize}
            getItemType={sizing?.getItemType}
            keyboardShouldPersistTaps="handled"
            sharedValues={sharedValues}
            recycleItems
            maintainVisibleContentPosition={MAINTAIN_VISIBLE_CONTENT_POSITION}
            showsVerticalScrollIndicator={false}
        />
    );
};
