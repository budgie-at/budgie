import { useLingui } from '@lingui/react/macro';
import { ReactNode, RefObject, useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined, isEmptyArray, isEmptyString, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { BottomSheet } from '../../../@generic/components/bottom-sheet/bottom-sheet';
import { BottomSheetScrollView } from '../../../@generic/components/bottom-sheet-scroll-view/bottom-sheet-scroll-view';
import { Button } from '../../../@generic/components/button/button';
import { IconName } from '../../../@generic/constant/icons.constant';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { BottomSheetSnapPoints } from '../../../@generic/type/bottom-sheet-snap-points.type';
import { TransactionFilterRenderItemsArgsType } from '../../type/transaction-filter-render-items-args.type';

import { TransactionFilterControls } from './transaction-filter-controls/transaction-filter-controls';
import { TransactionFilterHeader } from './transaction-filter-header/transaction-filter-header';

interface TransactionMultiSelectFilterProps<T extends { id: number }> {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly value: number[] | null;
    readonly onChange: (value: number[] | null) => void;

    readonly search: string;
    readonly onSearchChange: (search: string) => void;

    readonly icon: IconName;
    readonly items: T[];

    readonly title: string;
    readonly searchPlaceholder: string;

    readonly emptySearchText: ReactNode;
    readonly emptyState: ReactNode;

    readonly renderItems: (args: TransactionFilterRenderItemsArgsType<T>) => ReactNode;

    readonly snapPoints?: BottomSheetSnapPoints;
    readonly enableDynamicSizing?: boolean;
}

const snapPoints: BottomSheetSnapPoints = ['70%'];

export const TransactionMultiSelectFilter = <T extends { id: number }>(props: TransactionMultiSelectFilterProps<T>) => {
    const {
        ref,
        value,
        onChange,
        items,
        search,
        onSearchChange,
        title,
        searchPlaceholder,
        emptySearchText,
        emptyState,
        renderItems,
        icon
    } = props;

    const [localValue, setLocalValue] = useState<number[] | null>(() => value);
    const { bottom } = useSafeAreaInsets();
    const { t } = useLingui();

    const close = () => ref.current?.close();

    const handleClear = () => void setLocalValue(null);

    const handleApply = () => {
        onChange(localValue);
        close();
    };

    const localSelectedCount = localValue?.length ?? 0;

    const onSelect = (...selected: number[]) => {
        setLocalValue(prev => {
            if (!isDefined(prev)) {
                return selected;
            }

            const allSelected = selected.every(id => prev.includes(id));

            if (allSelected) {
                const next = prev.filter(id => !selected.includes(id));

                return isNotEmptyArray(next) ? next : null;
            }

            return Array.from(new Set([...prev, ...selected]));
        });
    };

    const handleSelectAll = () => void setLocalValue(items.map(item => item.id));
    const handleDeselectAll = () => void setLocalValue(null);

    const buttonText = isPositiveNumber(localSelectedCount) ? t`Apply Filter (${localSelectedCount})` : t`Apply Filter`;

    const empty = isNotEmptyString(search) ? (
        <View className="items-center border border-secondary-corner rounded-5xl bg-secondary-background px-xl py-[30px]">
            <Text className="text-secondary-foreground text-sm">{emptySearchText}</Text>
        </View>
    ) : (
        emptyState
    );

    return (
        <BottomSheet ref={ref} snapPoints={snapPoints}>
            <View className="flex-1">
                <TransactionFilterHeader title={title} icon={icon} onClear={handleClear} showClear={isPositiveNumber(localSelectedCount)} />

                <BottomSheetScrollView enableFooterMarginAdjustment={true} contentContainerClassName="gap-y-3xl py-[40px] px-7xl">
                    {isEmptyArray(items) && isEmptyString(search) ? null : (
                        <TransactionFilterControls
                            search={search}
                            onSelectAll={handleSelectAll}
                            onDeselectAll={handleDeselectAll}
                            searchPlaceholder={searchPlaceholder}
                            onSearchChange={onSearchChange}
                        />
                    )}

                    {isNotEmptyArray(items)
                        ? renderItems({
                              items,
                              onSelect,
                              selectedIds: localValue ?? []
                          })
                        : empty}
                </BottomSheetScrollView>

                <View className="px-7xl pt-4xl border-t border-t-secondary-corner bg-primary-reverse" style={{ paddingBottom: bottom }}>
                    <Button variant="ghost" onPress={handleApply} content={buttonText} />
                </View>
            </View>
        </BottomSheet>
    );
};
