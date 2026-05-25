import { UserIconNameEnum } from '@budgie/contracts';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { Icon } from '../../../@generic/component/icon/icon';

import type { TransactionPickerSearchDockPropsInterface } from '../../interface/transaction-picker-search-dock-props.interface';

const keyboardOffset = { closed: 0, opened: 8 };

export const TransactionPickerSearchDock = ({
    search,
    searchPlaceholder,
    footer,
    onSearchChange,
    searchTestID
}: TransactionPickerSearchDockPropsInterface) => {
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const showFooter = !isSearchFocused;

    const handleSearchFocus = () => {
        setIsSearchFocused(true);
    };

    const handleSearchBlur = () => {
        setIsSearchFocused(false);
    };

    return (
        <KeyboardStickyView offset={keyboardOffset}>
            <View className="gap-y-md px-xl pb-xl pt-md">
                <View className="h-[50px] flex-row items-center rounded-5xl border border-secondary-corner bg-secondary-background px-lg">
                    <Icon icon={UserIconNameEnum.Search} size={20} className="text-secondary-foreground" />
                    <TextInput
                        className="ml-sm flex-1 text-md text-primary"
                        value={search}
                        onChangeText={onSearchChange}
                        onFocus={handleSearchFocus}
                        onBlur={handleSearchBlur}
                        placeholder={searchPlaceholder}
                        placeholderTextColor="rgba(128, 128, 128, 0.6)"
                        autoCapitalize="none"
                        autoCorrect={false}
                        clearButtonMode="while-editing"
                        testID={searchTestID}
                    />
                </View>

                {showFooter ? footer : null}
            </View>
        </KeyboardStickyView>
    );
};
