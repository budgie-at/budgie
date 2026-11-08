import { useEffect, useRef, useState } from 'react';
import { KeyboardEvents, useKeyboardState } from 'react-native-keyboard-controller';

import { isPositiveNumber } from '@rnw-community/shared';

import { MORPHING_SHEET_DESTINATION_HEIGHT_RATIO } from '../../@generic/constant/morphing-sheet-height-ratio.constant';
import { useMorphingSheetListHeight } from '../../@generic/hook/use-morphing-sheet-list-height.hook';

import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

const FEE_REVEAL_GAP = 40;

export const useSheetScroll = () => {
    const isKeyboardVisible = useKeyboardState(state => state.isVisible);
    const { height: maxHeight } = useMorphingSheetListHeight(MORPHING_SHEET_DESTINATION_HEIGHT_RATIO);
    const scrollRef = useRef<ScrollView>(null);
    const revealRef = useRef({ feeBottom: 0, viewportHeight: 0 });
    const [heroTop, setHeroTop] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isFeeEditing, setIsFeeEditing] = useState(false);
    const [isFeePinned, setIsFeePinned] = useState(false);

    useEffect(() => {
        const subscription = KeyboardEvents.addListener('keyboardDidHide', () => {
            setIsFeePinned(false);
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const revealFee = () => {
        const revealOffset = revealRef.current.feeBottom + FEE_REVEAL_GAP - revealRef.current.viewportHeight;
        if (isFeeEditing && isPositiveNumber(revealOffset)) {
            scrollRef.current?.scrollTo({ y: Math.max(revealOffset, heroTop - FEE_REVEAL_GAP), animated: false });
        }
    };

    const handleFeeLayout = (event: LayoutChangeEvent) => {
        revealRef.current.feeBottom = event.nativeEvent.layout.y + event.nativeEvent.layout.height;
        revealFee();
    };

    const handleHeroLayout = (event: LayoutChangeEvent) => {
        setHeroTop(event.nativeEvent.layout.y);
    };

    const handleScrollLayout = (event: LayoutChangeEvent) => {
        revealRef.current.viewportHeight = event.nativeEvent.layout.height;
        revealFee();
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        setIsScrolled(isPositiveNumber(event.nativeEvent.contentOffset.y));
    };

    return {
        scrollViewProps: {
            ref: scrollRef,
            contentContainerStyle: { paddingBottom: isFeeEditing ? heroTop : 0 },
            onLayout: handleScrollLayout,
            onScroll: handleScroll,
            scrollEventThrottle: 16
        },
        sheetStyle: { maxHeight },
        isKeyboardVisible,
        isScrolled,
        isFeeShown: !isKeyboardVisible || isFeePinned,
        handleFeeEditingChange: (isEditing: boolean) => {
            setIsFeeEditing(isEditing);
            setIsFeePinned(previous => previous || isEditing);
        },
        handleFeeLayout,
        handleHeroLayout
    };
};
