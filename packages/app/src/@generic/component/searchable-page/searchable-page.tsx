import { ReactNode } from 'react';
import { TextInput, View } from 'react-native';
import { KeyboardStickyView, useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyFn, isNotEmptyArray } from '@rnw-community/shared';

import { useThemeContext } from '../../../theme/context/theme.context';
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
    const { isDarkColorSchema } = useThemeContext();
    const backgroundColor = isDarkColorSchema ? '#000000' : '#ffffff';
    const searchInputBottom = FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN + bottom - 15;
    const searchBlurStyle = { bottom: searchInputBottom - 100, zIndex: 10 };
    const searchInputStyle = { bottom: searchInputBottom, zIndex: 20, overflow: 'visible' as const };
    const keyboardOffset = { closed: 0, opened: searchInputBottom - 4 };

    const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
    const isKeyboardOpen = useDerivedValue(() => Math.abs(keyboardHeight.value) > 0);
    const keyboardBackgroundStyle = useAnimatedStyle(() => ({
        position: 'absolute' as const,
        top: 0,
        bottom: -200,
        left: -20,
        right: -20,
        backgroundColor,
        opacity: isKeyboardOpen.value ? 1 : 0
    }));

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
                <View className="px-xl pt-md overflow-visible">
                    <Animated.View style={keyboardBackgroundStyle} pointerEvents="none" />
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
