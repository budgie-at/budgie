import { CategoryEntityInterface, DEFAULT_CATEGORY_ICON } from '@budgie/contracts';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { addScrollContentInset } from '@rnw-community/react-native-screen-chrome';

import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../../@generic/constant/screen-chrome-content-inset.constant';
import { CategoryIconFixRow } from '../category-icon-fix-row/category-icon-fix-row';

import type { ReactElement } from 'react';

interface Props {
    readonly categories: CategoryEntityInterface[];
    readonly emptyState: ReactElement | null;
}

const keyExtractor = (category: CategoryEntityInterface) => String(category.id);

const renderItem = ({ item }: { item: CategoryEntityInterface }) => <CategoryIconFixRow category={item} />;

export const CategoryIconsList = ({ categories, emptyState }: Props) => {
    const { onScroll, scrollRef } = useCollapsibleHeaderScroll();
    const insets = useSafeAreaInsets();

    return (
        <Animated.FlatList
            ref={scrollRef}
            data={categories.filter(category => category.icon === DEFAULT_CATEGORY_ICON)}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ListEmptyComponent={emptyState}
            contentContainerStyle={addScrollContentInset(insets, SCREEN_CHROME_CONTENT_INSET_TOP, 0, { paddingBottom: 220 })}
            onScroll={onScroll}
            showsVerticalScrollIndicator={false}
        />
    );
};
