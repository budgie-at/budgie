import { AccountTypeEnum } from '@budgie/contracts';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Trans } from '@lingui/react';
import { useLingui } from '@lingui/react/macro';
import { useImperativeHandle, useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { USER_ICONS, UserIcon } from '../../constant/user-icons.constant';
import { FlatListDataItem, mapToFlatListData } from '../../map-to-flatlist-data.util';
import { BottomSheetSnapPoints } from '../../type/bottom-sheet-snap-points.type';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { IconSelectorCard } from '../icon-selector-card/icon-selector-card';

import type { IconName } from '../../constant/icons.constant';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { EmptyFn } from '@rnw-community/shared';
import type { Ref } from 'react';

interface Props {
    readonly onSelect: (icon: IconName) => void;
    readonly ref: Ref<{ open: EmptyFn }>;
    readonly selectedIcon: IconName;
    readonly closeOnSelect?: boolean;
}

const snapPoints: BottomSheetSnapPoints = ['70%'];

export const IconSelectorBottomSheet = ({ ref, selectedIcon, onSelect, closeOnSelect }: Props) => {
    const [search, setSearch] = useState('');
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const { t } = useLingui();

    const filteredIcons = USER_ICONS.filter(({ name }) => name.toLowerCase().includes(search.toLowerCase()));
    const data = mapToFlatListData(filteredIcons);

    useImperativeHandle(ref, () => ({
        open: () => {
            bottomSheetRef.current?.present();
        }
    }));

    const handleSelect = (icon: IconName) => {
        onSelect(icon);

        if (closeOnSelect) {
            bottomSheetRef.current?.close();
        }
    };

    const keyExtractor = (item: FlatListDataItem<UserIcon>, index: number) => (item.isEmpty ? `empty-${index}` : item.name);

    const renderItem = ({ item }: { item: FlatListDataItem<UserIcon> }) =>
        item.isEmpty ? (
            <View className="flex-1" />
        ) : (
            <IconSelectorCard
                accountType={AccountTypeEnum.BANK}
                icon={item.icon}
                isSelected={item.name === selectedIcon}
                name={item.name as IconName}
                onSelect={handleSelect}
            />
        );

    const translationValues = { count: filteredIcons.length };

    return (
        <BottomSheet ref={bottomSheetRef} snapPoints={snapPoints} contentClassName={'p-0'}>
            <View className="gap-y-1 px-6 py-[16px]">
                <Text className="text-[20px] text-primary font-semibold">{t`Choose Icon`}</Text>
                <Text className="text-[14px] text-secondary-foreground">
                    <Trans id="available-icons" message="{count} icons available" values={translationValues} />
                </Text>
            </View>

            <View className={'border-t-1 border-b-1 border-secondary-corner px-6 pt-[30px] pb-[25px]'}>
                <BottomSheetTextInput
                    className="rounded-[20px] bg-secondary-background h-[44px] px-[12px] border border-secondary-corner text-primary placeholder-secondary-reverse-foreground"
                    onChangeText={setSearch}
                    placeholder={t`Search icons (e.g., money, travel, food)...`}
                    value={search}
                />
            </View>

            <FlatList
                columnWrapperClassName="gap-x-[10px]"
                contentContainerClassName="gap-y-[10px] px-6 pt-[30px]"
                data={data}
                keyExtractor={keyExtractor}
                numColumns={4}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
            />
        </BottomSheet>
    );
};
