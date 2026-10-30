import { AnimatedLegendList } from '@legendapp/list/reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResolveClassNames } from 'uniwind';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';

import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../constant/screen-chrome-content-inset.constant';

import type { LegendListProps, LegendListRef } from '@legendapp/list/react-native';
import type { Ref } from 'react';

const MAINTAIN_VISIBLE_CONTENT_POSITION = { data: false, size: true };

export const CollapsibleChromeLegendList = <TItem,>({
    contentContainerStyle,
    ...props
}: LegendListProps<TItem> & { readonly ref?: Ref<LegendListRef> }) => {
    const { scrollY } = useCollapsibleHeaderScroll();
    const { top } = useSafeAreaInsets();
    const horizontalInset = useResolveClassNames('px-5xl');

    const sharedValues = { scrollOffset: scrollY };
    const contentContainerStyleWithInset = [{ paddingTop: top + SCREEN_CHROME_CONTENT_INSET_TOP }, horizontalInset, contentContainerStyle];

    return (
        <AnimatedLegendList
            {...props}
            contentContainerStyle={contentContainerStyleWithInset}
            sharedValues={sharedValues}
            maintainVisibleContentPosition={MAINTAIN_VISIBLE_CONTENT_POSITION}
            recycleItems
            showsVerticalScrollIndicator={false}
        />
    );
};
