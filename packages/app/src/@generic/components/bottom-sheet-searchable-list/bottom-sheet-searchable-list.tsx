import { JSX, RefObject } from 'react';
import { Edges, SafeAreaView } from 'react-native-safe-area-context';

import { isNotEmptyArray } from '@rnw-community/shared';

import { IconName } from '../../constant/icons.constant';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { BottomSheetHeaderAlign } from '../../type/bottom-sheet-header-align.type';
import { BottomSheetSnapPoints } from '../../type/bottom-sheet-snap-points.type';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { BottomSheetFlatList } from '../bottom-sheet-flat-list/bottom-sheet-flat-list';
import { BottomSheetHeader } from '../bottom-sheet-header/bottom-sheet-header';
import { BottomSheetSearch } from '../bottom-sheet-search/bottom-sheet-search';
import { EmptyState } from '../empty-state/empty-state';

interface SearchableListBottomSheetProps<T> {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly snapPoints?: BottomSheetSnapPoints;
    readonly index?: number;

    readonly title: string;
    readonly description: string;
    readonly search: string;
    readonly align?: BottomSheetHeaderAlign;
    readonly onSearchChange: (value: string) => void;
    readonly searchPlaceholder: string;

    readonly data: T[];
    readonly keyExtractor: (item: T, index: number) => string;
    readonly renderItem: ({ item }: { item: T }) => JSX.Element;

    readonly emptyTitle: string;
    readonly emptyIcon?: IconName;
    readonly emptyDescription: string;

    readonly flatListProps?: {
        className?: string;
        contentContainerClassName?: string;
        numColumns?: number;
        columnWrapperClassName?: string;
    };
}

const DEFAULT_SNAP_POINTS: BottomSheetSnapPoints = ['70%'];

const safeEdges: Edges = ['bottom'];
const listFooter = <SafeAreaView edges={safeEdges} />;

export const SearchableListBottomSheet = <T,>({
    ref,
    align,
    snapPoints = DEFAULT_SNAP_POINTS,
    index,
    title,
    description,
    search,
    onSearchChange,
    searchPlaceholder,
    data,
    keyExtractor,
    renderItem,
    emptyTitle,
    emptyDescription,
    flatListProps,
    emptyIcon
}: SearchableListBottomSheetProps<T>) => {
    const { className, contentContainerClassName, numColumns, columnWrapperClassName } = flatListProps ?? {};

    return (
        <BottomSheet ref={ref} snapPoints={snapPoints} index={index}>
            <BottomSheetHeader align={align} size="md" title={title} description={description} />
            <BottomSheetSearch onChangeText={onSearchChange} placeholder={searchPlaceholder} value={search} />

            {isNotEmptyArray(data) ? (
                <BottomSheetFlatList
                    className={className}
                    contentContainerClassName={contentContainerClassName}
                    columnWrapperClassName={columnWrapperClassName}
                    data={data}
                    keyExtractor={keyExtractor}
                    numColumns={numColumns}
                    renderItem={renderItem}
                    ListFooterComponent={listFooter}
                />
            ) : (
                <EmptyState circleIcon={emptyIcon} title={emptyTitle} description={emptyDescription} />
            )}
        </BottomSheet>
    );
};
