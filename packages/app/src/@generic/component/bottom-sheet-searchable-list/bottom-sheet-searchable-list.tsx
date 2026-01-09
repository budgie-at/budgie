import { UserIconNameEnum } from '@budgie/contracts';
import { FC, JSX, ReactNode, RefObject } from 'react';
import { Edges, SafeAreaView } from 'react-native-safe-area-context';

import { isNotEmptyArray } from '@rnw-community/shared';

import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { BottomSheetSnapPoints } from '../../type/bottom-sheet-snap-points.type';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { BottomSheetFlatList } from '../bottom-sheet-flat-list/bottom-sheet-flat-list';
import { BottomSheetSearch } from '../bottom-sheet-search/bottom-sheet-search';
import { EmptyState } from '../empty-state/empty-state';

import type { BottomSheetFooterProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetFooter';

interface SearchableListBottomSheetProps<T> {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly snapPoints?: BottomSheetSnapPoints;
    readonly index?: number;

    readonly search: string;
    readonly onSearchChange: (value: string) => void;
    readonly searchPlaceholder: string;

    readonly data: T[];
    readonly keyExtractor: (item: T, index: number) => string;
    readonly renderItem: ({ item }: { item: T }) => JSX.Element;

    readonly emptyTitle: string;
    readonly emptyIcon?: UserIconNameEnum;
    readonly emptyDescription: string;

    readonly flatListProps?: {
        className?: string;
        contentContainerClassName?: string;
        numColumns?: number;
        columnWrapperClassName?: string;
    };

    readonly listHeaderContent?: JSX.Element | null;
    readonly rightActionIcon?: UserIconNameEnum;
    readonly rightActionOnPress?: () => void;
    readonly footerComponent?: FC<BottomSheetFooterProps>;

    readonly children?: ReactNode;
}

const DEFAULT_SNAP_POINTS: BottomSheetSnapPoints = ['70%'];

const safeEdges: Edges = ['bottom'];
const listFooter = <SafeAreaView edges={safeEdges} />;

export const SearchableListBottomSheet = <T,>(props: SearchableListBottomSheetProps<T>) => {
    const {
        ref,
        snapPoints = DEFAULT_SNAP_POINTS,
        index,
        search,
        onSearchChange,
        searchPlaceholder,
        data,
        keyExtractor,
        renderItem,
        emptyTitle,
        emptyDescription,
        flatListProps,
        emptyIcon,
        listHeaderContent,
        rightActionIcon,
        rightActionOnPress,
        footerComponent,
        children
    } = props;

    const { className, contentContainerClassName, numColumns, columnWrapperClassName } = flatListProps ?? {};

    return (
        <BottomSheet ref={ref} snapPoints={snapPoints} index={index} footerComponent={footerComponent}>
            <BottomSheetSearch
                onChangeText={onSearchChange}
                placeholder={searchPlaceholder}
                value={search}
                rightActionIcon={rightActionIcon}
                rightActionOnPress={rightActionOnPress}
            />

            {isNotEmptyArray(data) ? (
                <BottomSheetFlatList
                    keyboardShouldPersistTaps="handled"
                    className={className}
                    contentContainerClassName={contentContainerClassName}
                    columnWrapperClassName={columnWrapperClassName}
                    data={data}
                    keyExtractor={keyExtractor}
                    numColumns={numColumns}
                    renderItem={renderItem}
                    ListHeaderComponent={listHeaderContent}
                    ListFooterComponent={listFooter}
                />
            ) : (
                <>
                    {listHeaderContent}
                    <EmptyState circleIcon={emptyIcon} title={emptyTitle} description={emptyDescription} />
                </>
            )}

            {children}
        </BottomSheet>
    );
};
