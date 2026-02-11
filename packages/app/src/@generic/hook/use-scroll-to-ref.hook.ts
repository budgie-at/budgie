import { useLocalSearchParams } from 'expo-router';
import { RefCallback, useRef } from 'react';
import { ScrollView, View } from 'react-native';


import { emptyFn } from '@rnw-community/shared';

const SCROLL_DELAY_MS = 300;

interface UseScrollToRefReturn {
    readonly scrollViewRef: RefCallback<ScrollView>;
    readonly anchorRef: (name: string) => RefCallback<View>;
}

export const useScrollToRef = (): UseScrollToRefReturn => {
    const { anchor } = useLocalSearchParams<{ anchor?: string }>();
    const scrollViewInstance = useRef<ScrollView | null>(null);

    const scrollViewRef = (node: ScrollView | null): void => {
        scrollViewInstance.current = node;
    };

    const anchorRef =
        (name: string) =>
        (node: View | null): (() => void) => {
            if (anchor !== name || node === null) {
                return emptyFn;
            }

            const timer = setTimeout(() => {
                node.measureInWindow((_x, y) => {
                    scrollViewInstance.current?.scrollTo({ y, animated: true });
                });
            }, SCROLL_DELAY_MS);

            return () => void clearTimeout(timer);
        };

    return { scrollViewRef, anchorRef };
};
