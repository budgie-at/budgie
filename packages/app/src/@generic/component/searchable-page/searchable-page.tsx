import { ReactNode } from 'react';
import { TextInput, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyFn, isNotEmptyArray } from '@rnw-community/shared';

import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../constant/floating-tab-bar.constant';
import { IdInterface } from '../../interface/id.interface';
import { BlurGradient } from '../blur-gradient/blur-gradient';
import { Page } from '../page/page';
import { PageHeader } from '../page-header/page-header';
import { SearchablePageList } from '../searchable-page-list/searchable-page-list';

interface Props<T extends IdInterface> {
    title: string;
    search: string;
    data: T[] | null;
    onGoBack: EmptyFn;
    searchPlaceholder: string;
    emptyState: ReactNode;
    onSearchChange: (search: string) => void;
    onDelete: (id: number) => Promise<void>;
    renderCard: (item: T) => ReactNode;
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
    children
}: Props<T>) => {
    const { bottom } = useSafeAreaInsets();
    const searchInputBottom = FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN + bottom - 15;
    const searchBlurStyle = { bottom: searchInputBottom - 100, zIndex: 10 };
    const searchInputStyle = { bottom: searchInputBottom, zIndex: 20 };
    const keyboardOffset = { closed: 0, opened: searchInputBottom - 4 };

    return (
        <View className="flex-1">
            <Page withBlur header={<PageHeader onGoBack={onGoBack} title={title} />}>
                {isNotEmptyArray(data) ? (
                    <SearchablePageList onDelete={onDelete} data={data} renderCard={renderCard}>
                        {children}
                    </SearchablePageList>
                ) : (
                    emptyState
                )}
            </Page>

            <View className="absolute inset-x-0 h-[150px]" style={searchBlurStyle}>
                <BlurGradient position="bottom" />
            </View>
            <KeyboardStickyView offset={keyboardOffset} style={searchInputStyle} className="absolute inset-x-0">
                <View className="px-xl pb-md pt-md bg-background">
                    <TextInput
                        value={search}
                        onChangeText={onSearchChange}
                        placeholder={searchPlaceholder}
                        className="text-primary placeholder:text-secondary-foreground h-[44px] px-xl bg-secondary-background rounded-5xl border border-secondary-corner"
                    />
                </View>
            </KeyboardStickyView>
        </View>
    );
};
