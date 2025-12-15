import { ComponentProps } from 'react';
import { Text, TextInput, View } from 'react-native';

import { EmptyFn, isNotEmptyArray } from '@rnw-community/shared';

import { ICONS, IconName } from '../../constant/icons.constant';
import { IdInterface } from '../../interface/id.interface';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';
import { Page } from '../page/page';
import { SearchablePageCreate } from '../searchable-page-create/searchable-page-create';
import { SearchablePageList } from '../searchable-page-list/searchable-page-list';
import { SearchablePageEmptyState } from '../searchagle-page-empty-state/searchagle-page-empty-state';

interface Props<T extends IdInterface> extends Omit<ComponentProps<typeof SearchablePageList<T>>, 'data'> {
    title: string;
    search: string;
    data: T[] | null;
    onGoBack: EmptyFn;
    searchPlaceholder: string;
    emptyStateTitle: string;
    emptyStateDescription: string;
    emptyStateIcon: IconName;
    onSearchChange: (search: string) => void;
}

export const SearchablePage = <T extends IdInterface>({
    data,
    onDelete,
    search,
    title,
    renderCard,
    renderBottomSheet,
    searchPlaceholder,
    onSearchChange,
    emptyStateTitle,
    emptyStateIcon,
    emptyStateDescription,
    onGoBack
}: Props<T>) => (
    <Page
        header={
            <View className="pb-7xl px-5xl border-b border-b-secondary-corner">
                <View className="flex-row items-center gap-x-2xl mb-7xl">
                    <HapticPressable className="p-md" onPress={onGoBack}>
                        <Icon className="text-primary" icon={ICONS.ChevronLeft} size={24} />
                    </HapticPressable>

                    <Text className="text-primary text-6xl">{title}</Text>
                </View>

                <TextInput
                    value={search}
                    onChangeText={onSearchChange}
                    placeholder={searchPlaceholder}
                    className="text-primary placeholder:text-secondary-foreground h-[44px] px-xl bg-secondary-background rounded-5xl border border-secondary-corner"
                />
            </View>
        }
    >
        {isNotEmptyArray(data) ? (
            <SearchablePageList onDelete={onDelete} data={data} renderCard={renderCard} renderBottomSheet={renderBottomSheet} />
        ) : (
            <SearchablePageEmptyState title={emptyStateTitle} icon={emptyStateIcon} description={emptyStateDescription} />
        )}

        <SearchablePageCreate renderBottomSheet={renderBottomSheet} />
    </Page>
);
