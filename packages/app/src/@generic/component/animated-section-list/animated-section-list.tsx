import { SectionList } from 'react-native';

import type { ReactElement, Ref } from 'react';
import type { DefaultSectionT, NativeScrollEvent, NativeSyntheticEvent, SectionListProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

interface Props<ItemT, SectionT = DefaultSectionT> extends SectionListProps<ItemT, SectionT> {
    readonly scrollY: SharedValue<number>;
    readonly ref?: Ref<SectionList<ItemT, SectionT>>;
}

export const AnimatedSectionList = <ItemT, SectionT = DefaultSectionT>({
    scrollY,
    ref,
    onScroll,
    ...rest
}: Props<ItemT, SectionT>): ReactElement => {
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollY.set(event.nativeEvent.contentOffset.y);
        onScroll?.(event);
    };

    return (
        <SectionList<ItemT, SectionT> ref={ref} onScroll={handleScroll} scrollEventThrottle={16} stickySectionHeadersEnabled {...rest} />
    );
};
