import { RefCallback, useRef } from 'react';
import { ScrollView, View } from 'react-native';

import { emptyFn, isNotEmptyString } from '@rnw-community/shared';

const SCROLL_DELAY_MS = 300;

export const useScrollToRef = (scrollTo: string | undefined): { scrollViewRef: RefCallback<ScrollView>; sectionRef: RefCallback<View> } => {
    const scrollViewInstance = useRef<ScrollView | null>(null);

    const scrollViewRef = (node: ScrollView | null): void => {
        scrollViewInstance.current = node;
    };

    const sectionRef = (node: View | null): (() => void) => {
        if (!isNotEmptyString(scrollTo) || node === null) {
            return emptyFn;
        }

        const timer = setTimeout(() => {
            node.measureInWindow((_x, y) => {
                scrollViewInstance.current?.scrollTo({ y, animated: true });
            });
        }, SCROLL_DELAY_MS);

        return () => void clearTimeout(timer);
    };

    return { scrollViewRef, sectionRef };
};
