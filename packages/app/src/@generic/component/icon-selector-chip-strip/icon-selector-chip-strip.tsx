import { useEffect, useRef } from 'react';
import { ScrollView, View } from 'react-native';

import { IconSelectorChip } from '../icon-selector-chip/icon-selector-chip';

import type { IconSelectorChipInterface } from '../../interface/icon-selector-chip.interface';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly chips: readonly IconSelectorChipInterface[];
    readonly activeIndex: number;
    readonly onSelect: (index: number) => void;
}

const CHIP_INSET = 16;
const CONTENT_CONTAINER_STYLE = { paddingHorizontal: CHIP_INSET, columnGap: 8 };

export const IconSelectorChipStrip = ({ chips, activeIndex, onSelect }: Props) => {
    const scrollRef = useRef<ScrollView>(null);
    const chipOffsets = useRef(new Map<number, number>());

    useEffect(() => {
        scrollRef.current?.scrollTo({ x: Math.max(0, (chipOffsets.current.get(activeIndex) ?? 0) - CHIP_INSET), animated: true });
    }, [activeIndex]);

    return (
        <View>
            <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={CONTENT_CONTAINER_STYLE}
            >
                {chips.map((chip, index) => {
                    const handlePress = () => void onSelect(index);
                    const handleLayout = (event: LayoutChangeEvent) => {
                        chipOffsets.current.set(index, event.nativeEvent.layout.x);
                    };

                    return (
                        <IconSelectorChip
                            key={chip.title}
                            label={chip.label}
                            title={chip.title}
                            isActive={index === activeIndex}
                            onPress={handlePress}
                            onLayout={handleLayout}
                        />
                    );
                })}
            </ScrollView>
            <View pointerEvents="none" className="absolute inset-y-0 left-0 w-[16px] bg-linear-to-r from-surface to-surface/0" />
            <View pointerEvents="none" className="absolute inset-y-0 right-0 w-[24px] bg-linear-to-l from-surface to-surface/0" />
        </View>
    );
};
