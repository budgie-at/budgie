import { UserIconNameEnum } from '@budgie/contracts';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { isEmptyArray, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { ListItemSeparator } from '../../../@generic/component/list-item-separator/list-item-separator';
import { TransactionPickerRow } from '../transaction-picker-row/transaction-picker-row';
import { TransactionPickerSearchDock } from '../transaction-picker-search-dock/transaction-picker-search-dock';

import type { TransactionPickerPropsInterface } from '../../interface/transaction-picker-props.interface';

export const TransactionPicker = (props: TransactionPickerPropsInterface) => {
    const {
        items,
        selectedItemId,
        search,
        searchPlaceholder,
        isLoading,
        errorMessage,
        emptyTitle,
        emptyDescription,
        footer,
        onSearchChange,
        onSelectItem,
        testID,
        searchTestID,
        rowTestID
    } = props;

    const hasItems = isNotEmptyArray(items);
    const showEmpty = !isLoading && isEmptyArray(items);

    return (
        <View className="flex-1 pt-2xl" collapsable={false} testID={testID}>
            <View className="flex-1">
                {isNotEmptyString(errorMessage) ? (
                    <Text className="px-xl pb-md pt-xl text-sm text-destructive-foreground">{errorMessage}</Text>
                ) : null}

                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator />
                    </View>
                ) : null}

                {showEmpty ? (
                    <EmptyState
                        circleIcon={UserIconNameEnum.SearchX}
                        title={emptyTitle}
                        description={emptyDescription}
                        className="flex-1 px-2xl py-0"
                        iconClassName="mb-lg"
                        titleClassName="text-center"
                        descriptionClassName="max-w-[260px] text-center leading-5"
                    />
                ) : null}

                {hasItems ? (
                    <ScrollView
                        className="flex-1"
                        contentContainerClassName="px-xl pb-lg"
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {items.map((item, index) => {
                            const isSelected = selectedItemId === item.id;

                            return (
                                <View key={item.id}>
                                    {index > 0 ? <ListItemSeparator /> : null}
                                    <TransactionPickerRow
                                        item={item}
                                        isSelected={isSelected}
                                        onPress={onSelectItem}
                                        testID={rowTestID(item.id)}
                                    />
                                </View>
                            );
                        })}
                    </ScrollView>
                ) : null}
            </View>

            <TransactionPickerSearchDock
                search={search}
                searchPlaceholder={searchPlaceholder}
                footer={footer}
                onSearchChange={onSearchChange}
                searchTestID={searchTestID}
            />
        </View>
    );
};
