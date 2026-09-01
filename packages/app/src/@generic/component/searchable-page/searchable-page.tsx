import { ReactElement, ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';
import { EmptyFn, isNotEmptyArray } from '@rnw-community/shared';

import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../constant/floating-tab-bar.constant';
import { IdInterface } from '../../interface/id.interface';
import { ScreenChromeThemeProvider } from '../../provider/screen-chrome-theme.provider';
import { CollapsibleChromeHeader } from '../collapsible-chrome-header/collapsible-chrome-header';
import { CollapsibleHeaderBackdrop } from '../collapsible-header-backdrop/collapsible-header-backdrop';
import { CollapsibleHeaderLargeTitle } from '../collapsible-header-large-title/collapsible-header-large-title';
import { EdgeFade } from '../edge-fade/edge-fade';
import { GoBackButton } from '../go-back-button/go-back-button';
import { KeyboardStickySearchInput } from '../keyboard-sticky-search-input/keyboard-sticky-search-input';
import { SearchablePageList } from '../searchable-page-list/searchable-page-list';

import { SEARCH_BLUR_OFFSET, SEARCH_BLUR_Z_INDEX, SEARCH_INPUT_VERTICAL_OFFSET, SEARCH_KEYBOARD_GAP } from './searchable-page.constant';

import type { LegendListSizingInterface } from '../../interface/legend-list-sizing.interface';
import type { DeleteConfirmation } from '../deletable-row/deletable-row';

interface Props<T extends IdInterface> {
    title: string;
    search: string;
    data: T[] | null;
    onGoBack: EmptyFn;
    searchPlaceholder: string;
    emptyState: ReactNode;
    onSearchChange: (search: string) => void;
    onDelete?: (id: number) => Promise<void>;
    renderCard: (item: T, index: number) => ReactNode;
    getDeleteConfirmation?: (item: T) => DeleteConfirmation | undefined;
    searchInputTestID?: string;
    testID?: string;
    listHeader?: ReactElement | null;
    estimatedHeaderSize?: number;
    children?: ReactNode;
    sizing?: LegendListSizingInterface<T>;
}

export const SearchablePage = <T extends IdInterface>({
    data,
    onDelete,
    search,
    title,
    renderCard,
    searchPlaceholder,
    onSearchChange,
    emptyState,
    onGoBack,
    getDeleteConfirmation,
    searchInputTestID,
    testID,
    listHeader,
    estimatedHeaderSize,
    children,
    sizing
}: Props<T>) => {
    const { bottom } = useSafeAreaInsets();
    const searchInputBottom = FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN + bottom - SEARCH_INPUT_VERTICAL_OFFSET;
    const searchBlurStyle = { bottom: searchInputBottom - SEARCH_BLUR_OFFSET, zIndex: SEARCH_BLUR_Z_INDEX };

    const largeTitleLayer = (
        <CollapsibleHeaderLargeTitle hasLeadingSlot>
            <Text className="text-primary font-medium text-3xl" numberOfLines={1}>
                {title}
            </Text>
        </CollapsibleHeaderLargeTitle>
    );
    const smallTitleLayer = (
        <Text className="text-primary text-lg font-semibold text-center" numberOfLines={1}>
            {title}
        </Text>
    );

    return (
        <View className="flex-1">
            <ScreenChromeThemeProvider>
                <ScreenChromeFrame>
                    <View className="flex-1 px-5xl" testID={testID}>
                        {isNotEmptyArray(data) ? (
                            <SearchablePageList
                                onDelete={onDelete}
                                data={data}
                                renderCard={renderCard}
                                getDeleteConfirmation={getDeleteConfirmation}
                                listHeader={listHeader}
                                estimatedHeaderSize={estimatedHeaderSize}
                                sizing={sizing}
                            >
                                {children}
                            </SearchablePageList>
                        ) : (
                            emptyState
                        )}
                    </View>

                    <CollapsibleHeaderBackdrop />

                    <CollapsibleChromeHeader
                        leading={<GoBackButton onPress={onGoBack} />}
                        expandedTitle={largeTitleLayer}
                        collapsedTitle={smallTitleLayer}
                    />
                </ScreenChromeFrame>
            </ScreenChromeThemeProvider>

            <View className="absolute inset-x-0 h-[150px]" style={searchBlurStyle}>
                <EdgeFade position="bottom" />
            </View>
            <KeyboardStickySearchInput
                search={search}
                placeholder={searchPlaceholder}
                onSearchChange={onSearchChange}
                inputBottom={searchInputBottom}
                keyboardGap={SEARCH_KEYBOARD_GAP}
                testID={searchInputTestID}
            />
        </View>
    );
};
