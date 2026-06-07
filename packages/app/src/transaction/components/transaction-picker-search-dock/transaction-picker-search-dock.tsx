import { type ReactNode, useState } from 'react';
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { SearchInput } from '../../../@generic/component/search-input/search-input';

interface Props {
    readonly search: string;
    readonly searchPlaceholder: string;
    readonly footer: ReactNode;
    readonly onSearchChange: (value: string) => void;
    readonly searchTestID: string;
}

const keyboardOffset = { closed: 0, opened: 8 };

export const TransactionPickerSearchDock = ({ search, searchPlaceholder, footer, onSearchChange, searchTestID }: Props) => {
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
                <SearchInput
                    value={search}
                    onChangeText={onSearchChange}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    placeholder={searchPlaceholder}
                    testID={searchTestID}
                />

                {showFooter ? footer : null}
            </View>
        </KeyboardStickyView>
    );
};
