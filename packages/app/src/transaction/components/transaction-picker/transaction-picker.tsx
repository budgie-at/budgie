import { UserIconNameEnum } from '@budgie/contracts';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { Icon } from '../../../@generic/component/icon/icon';
import { ListItemSeparator } from '../../../@generic/component/list-item-separator/list-item-separator';
import { TransactionPickerRow } from '../transaction-picker-row/transaction-picker-row';

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
        <View className="flex-1 pt-4xl" collapsable={false} testID={testID}>
            <View className="px-xl pb-lg">
                <View className="h-[50px] flex-row items-center rounded-5xl border border-secondary-corner bg-secondary-background px-lg">
                    <Icon icon={UserIconNameEnum.Search} size={20} className="text-secondary-foreground" />
                    <TextInput
                        className="ml-sm flex-1 text-md text-primary"
                        value={search}
                        onChangeText={onSearchChange}
                        placeholder={searchPlaceholder}
                        placeholderTextColor="rgba(128, 128, 128, 0.6)"
                        autoCapitalize="none"
                        autoCorrect={false}
                        clearButtonMode="while-editing"
                        testID={searchTestID}
                    />
                </View>
            </View>

            {isDefined(errorMessage) ? <Text className="px-xl pb-md pt-xl text-sm text-destructive-foreground">{errorMessage}</Text> : null}

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator />
                </View>
            ) : null}

            {showEmpty ? (
                <View className="flex-1 items-center justify-center">
                    <EmptyState circleIcon={UserIconNameEnum.SearchX} title={emptyTitle} description={emptyDescription} />
                </View>
            ) : null}

            {hasItems ? (
                <ScrollView
                    className="flex-1"
                    contentContainerClassName="px-xl pb-xl"
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

            <View className="gap-y-md px-xl pb-xl">{footer}</View>
        </View>
    );
};
