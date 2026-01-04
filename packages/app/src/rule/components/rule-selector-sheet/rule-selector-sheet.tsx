import { Ref } from 'react';
import { Text, View } from 'react-native';

import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetScrollView } from '../../../@generic/component/bottom-sheet-scroll-view/bottom-sheet-scroll-view';
import { SelectorCard } from '../../../@generic/component/selector-card/selector-card';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';

interface RuleSelectorOption<T> {
    value: T;
    label: string;
    subtitle?: string;
}

interface Props<T> {
    readonly ref: Ref<BottomSheetInterface | null>;
    readonly title: string;
    readonly options: RuleSelectorOption<T>[];
    readonly selectedValue: T | null;
    readonly onSelect: (value: T) => void;
}

export const RuleSelectorSheet = <T,>({ ref, title, options, selectedValue, onSelect }: Props<T>) => (
    <BottomSheet enableDynamicSizing ref={ref}>
        <BottomSheetScrollView>
            <View className="p-5xl gap-y-lg">
                <Text className="text-primary text-lg font-semibold mb-lg">{title}</Text>
                {options.map(option => (
                    <SelectorCard
                        key={String(option.value)}
                        identifier={option.value}
                        isSelected={option.value === selectedValue}
                        onSelect={onSelect}
                        title={option.label}
                        subtitle={option.subtitle}
                    />
                ))}
            </View>
        </BottomSheetScrollView>
    </BottomSheet>
);
