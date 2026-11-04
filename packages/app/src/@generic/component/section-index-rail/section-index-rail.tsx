import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { useVibration } from '../../hook/use-vibration.hook';
import { SectionIndexLetter } from '../section-index-letter/section-index-letter';

import type { AccessibilityActionEvent, LayoutChangeEvent } from 'react-native';
import type { PanGestureHandlerEventPayload } from 'react-native-gesture-handler';

interface Props {
    readonly letters: readonly string[];
    readonly activeLetter: string | null;
    readonly onSelect: (letter: string) => void;
}

const ACCESSIBILITY_ACTIONS = [{ name: 'increment' }, { name: 'decrement' }] as const;
const RAIL_HIT_SLOP = { left: 14, top: 8, bottom: 8 };

export const SectionIndexRail = ({ letters, activeLetter, onSelect }: Props) => {
    const { t } = useLingui();
    const [, , hapticSelection] = useVibration();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const railHeight = useSharedValue(0);
    const lastIndex = useSharedValue(-1);

    const handleLayout = (event: LayoutChangeEvent) => {
        railHeight.set(event.nativeEvent.layout.height);
    };
    const handleIndex = (index: number) => {
        hapticSelection();
        setActiveIndex(index);
        onSelect(letters[index] ?? '');
    };
    const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
        const step = event.nativeEvent.actionName === 'increment' ? 1 : -1;
        const currentIndex = Math.max(0, letters.indexOf(activeLetter ?? ''));
        const index = Math.min(letters.length - 1, Math.max(0, currentIndex + step));

        onSelect(letters[index] ?? '');
    };

    const handleScrub = ({ y }: PanGestureHandlerEventPayload) => {
        'worklet';
        if (railHeight.get() <= 0) {
            return;
        }

        const index = Math.min(letters.length - 1, Math.max(0, Math.floor((y / railHeight.get()) * letters.length)));

        if (index !== lastIndex.get()) {
            lastIndex.set(index);
            runOnJS(handleIndex)(index);
        }
    };

    const gesture = Gesture.Pan()
        .minDistance(0)
        .hitSlop(RAIL_HIT_SLOP)
        .onBegin(handleScrub)
        .onUpdate(handleScrub)
        .onFinalize(() => {
            lastIndex.set(-1);
            runOnJS(setActiveIndex)(null);
        });

    const scrubLetter = isDefined(activeIndex) ? letters[activeIndex] : null;
    const highlightedLetter = scrubLetter ?? activeLetter;
    const accessibilityValue = { text: highlightedLetter ?? letters.at(0) ?? '' };

    return (
        <View className="max-h-full flex-row items-center">
            {isDefined(scrubLetter) ? (
                <View className="mr-md h-[48px] w-[48px] items-center justify-center rounded-full bg-surface-fill" pointerEvents="none">
                    <Text className="text-primary text-[24px] font-semibold">{scrubLetter}</Text>
                </View>
            ) : null}
            <GestureDetector gesture={gesture}>
                <View
                    className="max-h-full w-[16px] shrink items-center justify-center py-xs"
                    onLayout={handleLayout}
                    accessible
                    accessibilityRole="adjustable"
                    accessibilityLabel={t`Section index`}
                    accessibilityValue={accessibilityValue}
                    accessibilityActions={ACCESSIBILITY_ACTIONS}
                    onAccessibilityAction={handleAccessibilityAction}
                >
                    {letters.map(letter => (
                        <SectionIndexLetter key={letter} letter={letter} isActive={letter === highlightedLetter} />
                    ))}
                </View>
            </GestureDetector>
        </View>
    );
};
