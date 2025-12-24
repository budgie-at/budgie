import { ReactNode, RefObject, useImperativeHandle, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { emptyFn, isEmptyArray, isEmptyString, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { BottomSheetScrollView } from '../../../@generic/component/bottom-sheet-scroll-view/bottom-sheet-scroll-view';
import { IconName } from '../../../@generic/constant/icons.constant';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { BottomSheetSnapPoints } from '../../../@generic/type/bottom-sheet-snap-points.type';
import { TransactionFilterRenderItemsArgsInterface } from '../../interface/transaction-filter-render-items-args.interface';
import { toggleFilterSelection } from '../../utils/toggle-filter-selection.util';
import { TransactionFilterControls } from '../transaction-filter-controls/transaction-filter-controls';

import { TransactionBaseFilter } from './transaction-base-filter';

interface TransactionMultiSelectFilterProps<T extends { id: number }> {
    readonly ref: RefObject<BottomSheetInterface<number[]> | null>;
    readonly value: number[] | null;
    readonly onChange: (value: number[] | null) => void;

    readonly search: string;
    readonly onSearchChange: (search: string) => void;

    readonly icon: IconName;
    readonly items: T[];
    readonly total: number;

    readonly title: string;
    readonly searchPlaceholder: string;

    readonly emptySearchText: ReactNode;
    readonly emptyState: ReactNode;

    readonly renderItems: (args: TransactionFilterRenderItemsArgsInterface<T>) => ReactNode;

    readonly snapPoints?: BottomSheetSnapPoints;
    readonly enableDynamicSizing?: boolean;
}

const snapPoints: BottomSheetSnapPoints = ['70%'];

export const TransactionBaseSearchableFilter = <T extends { id: number }>(props: TransactionMultiSelectFilterProps<T>) => {
    const {
        ref,
        value,
        total,
        onChange,
        items,
        search,
        onSearchChange,
        title,
        icon,
        searchPlaceholder,
        emptySearchText,
        emptyState,
        renderItems
    } = props;

    const [localValue, setLocalValue] = useState<number[] | null>(() => value);
    const internalRef = useRef<BottomSheetInterface>(null);

    const close = () => void ref.current?.close();

    const handleClear = () => void setLocalValue(null);

    const handleApply = () => {
        onChange(localValue);
        close();
    };

    const localSelectedCount = localValue?.length ?? 0;

    const onSelect = (...selected: number[]) => {
        setLocalValue(prev => toggleFilterSelection(prev, selected));
    };

    const handleSelectAll = () => void setLocalValue(items.map(item => item.id));
    const handleDeselectAll = () => void setLocalValue(null);

    useImperativeHandle(ref, () => ({
        open: value => {
            setLocalValue(value ?? null);
            internalRef.current?.open();
        },
        close: internalRef.current?.close ?? emptyFn,
        dismiss: internalRef.current?.dismiss ?? emptyFn
    }));

    const empty =
        isNotEmptyString(search) && isPositiveNumber(total) ? (
            <View className="items-center border border-secondary-corner rounded-5xl bg-secondary-background px-xl py-[30px]">
                <Text className="text-secondary-foreground text-sm">{emptySearchText}</Text>
            </View>
        ) : (
            emptyState
        );

    return (
        <TransactionBaseFilter
            icon={icon}
            onClear={handleClear}
            onApply={handleApply}
            title={title}
            selected={localSelectedCount}
            ref={internalRef}
            snapPoints={snapPoints}
            hasSelected={isPositiveNumber(localSelectedCount)}
        >
            <BottomSheetScrollView enableFooterMarginAdjustment={true} contentContainerClassName="py-[40px] px-7xl gap-y-3xl">
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
        </TransactionBaseFilter>
    );
};
