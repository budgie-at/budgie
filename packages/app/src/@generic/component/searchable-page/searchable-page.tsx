import { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyFn, isNotEmptyArray } from '@rnw-community/shared';

import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../constant/floating-tab-bar.constant';
import { IdInterface } from '../../interface/id.interface';
import { BlurGradient } from '../blur-gradient/blur-gradient';
import { KeyboardStickySearchInput } from '../keyboard-sticky-search-input/keyboard-sticky-search-input';
import { Page } from '../page/page';
import { PageHeader } from '../page-header/page-header';
import { SearchablePageList } from '../searchable-page-list/searchable-page-list';

import { SEARCH_BLUR_OFFSET, SEARCH_BLUR_Z_INDEX, SEARCH_INPUT_VERTICAL_OFFSET, SEARCH_KEYBOARD_GAP } from './searchable-page.constant';

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
    renderCard: (item: T) => ReactNode;
    getDeleteConfirmation?: (item: T) => DeleteConfirmation | undefined;
    searchInputTestID?: string;
    testID?: string;
    children?: ReactNode;
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
    children
}: Props<T>) => {
    const { bottom } = useSafeAreaInsets();
    const searchInputBottom = FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN + bottom - SEARCH_INPUT_VERTICAL_OFFSET;
    const searchBlurStyle = { bottom: searchInputBottom - SEARCH_BLUR_OFFSET, zIndex: SEARCH_BLUR_Z_INDEX };

    return (
        <View className="flex-1">
            <Page testID={testID} withBlur header={<PageHeader onGoBack={onGoBack} title={title} />}>
                {isNotEmptyArray(data) ? (
                    <SearchablePageList
                        onDelete={onDelete}
                        data={data}
                        renderCard={renderCard}
                        getDeleteConfirmation={getDeleteConfirmation}
                    >
                        {children}
                    </SearchablePageList>
                ) : (
                    emptyState
                )}
            </Page>

            <View className="absolute inset-x-0 h-[150px]" style={searchBlurStyle}>
                <BlurGradient position="bottom" />
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
