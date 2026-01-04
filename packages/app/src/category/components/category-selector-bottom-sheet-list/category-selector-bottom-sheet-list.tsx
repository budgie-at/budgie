import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { JSX, RefObject, useRef } from 'react';
import { InteractionManager, View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { Edges, SafeAreaView } from 'react-native-safe-area-context';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetFlatList } from '../../../@generic/component/bottom-sheet-flat-list/bottom-sheet-flat-list';
import { BottomSheetHeader } from '../../../@generic/component/bottom-sheet-header/bottom-sheet-header';
import { BottomSheetSearch } from '../../../@generic/component/bottom-sheet-search/bottom-sheet-search';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { BottomSheetHeaderAlign } from '../../../@generic/type/bottom-sheet-header-align.type';
import { BottomSheetSnapPoints } from '../../../@generic/type/bottom-sheet-snap-points.type';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface CategorySelectorBottomSheetListProps<T> {
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
    readonly emptyIcon?: UserIconNameEnum;
    readonly emptyDescription: string;

    readonly flatListProps?: {
        className?: string;
        contentContainerClassName?: string;
        numColumns?: number;
        columnWrapperClassName?: string;
    };

    readonly onCreateCategory: () => void;
    readonly variant: ColorPaletteVariant;
}

const DEFAULT_SNAP_POINTS: BottomSheetSnapPoints = ['70%'];

const safeEdges: Edges = ['bottom'];

export const CategorySelectorBottomSheetList = <T,>({
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
    emptyIcon,
    onCreateCategory,
    variant
}: CategorySelectorBottomSheetListProps<T>) => {
    const { className, contentContainerClassName, numColumns, columnWrapperClassName } = flatListProps ?? {};
    const inputRef = useRef<TextInput>(null);
    const { t } = useLingui();

    const handleSheetChange = (sheetIndex: number) => {
        if (sheetIndex >= 0) {
            InteractionManager.runAfterInteractions(() => {
                inputRef.current?.focus();
            });
        }
    };

    const listHeader = (
        <View className="px-6 pb-lg">
            <Button
                variant={variant}
                leftIcon={UserIconNameEnum.Plus}
                content={t`Create New Category`}
                onPress={onCreateCategory}
            />
        </View>
    );

    const listFooter = <SafeAreaView edges={safeEdges} />;

    return (
        <BottomSheet ref={ref} snapPoints={snapPoints} index={index} onChange={handleSheetChange}>
            <BottomSheetHeader align={align} size="md" title={title} description={description} />
            <BottomSheetSearch ref={inputRef} onChangeText={onSearchChange} placeholder={searchPlaceholder} value={search} />

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
                    ListHeaderComponent={listHeader}
                    ListFooterComponent={listFooter}
                />
            ) : (
                <>
                    {listHeader}
                    <EmptyState circleIcon={emptyIcon} title={emptyTitle} description={emptyDescription} />
                </>
            )}
        </BottomSheet>
    );
};
