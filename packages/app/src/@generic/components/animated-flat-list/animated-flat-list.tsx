import { ComponentProps, ReactNode } from 'react';
import { FlatList } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import type { ListRenderItem } from '@react-native/virtualized-lists';

interface Props<T> extends Pick<ComponentProps<typeof FlatList>, 'className' | 'contentContainerClassName' | 'contentContainerStyle' | 'ListFooterComponent'> {
    readonly data: readonly T[];
    readonly keyExtractor: (item: T, index: number) => string;
    readonly renderItem: (item: T, index: number) => ReactNode;
}

const STIFFNESS = 220;
const DURATION = 180;
const DAMPING = 22;

export const AnimatedFlatList = <T,>({ data, keyExtractor, renderItem, ...rest }: Props<T>) => {
    const internalRenderItem: ListRenderItem<T> = ({ item, index }) => (
        <Animated.View
            entering={FadeIn.duration(DURATION)}
            exiting={FadeOut.duration(DURATION)}
            layout={LinearTransition.damping(DAMPING).stiffness(STIFFNESS)}
        >
            {renderItem(item, index)}
        </Animated.View>
    );

    return (
        <FlatList data={data} keyExtractor={keyExtractor} renderItem={internalRenderItem} showsVerticalScrollIndicator={false} {...rest} />
    );
};
