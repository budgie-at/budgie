import { useRef } from 'react';
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { isNotEmptyString } from '@rnw-community/shared';

import { READABLE_CONTENT_CLASSNAME } from '../../constant/readable-content-classname.constant';
import { useCollapsibleChromeSearch } from '../../context/collapsible-chrome-search.context';
import { useSearchInputBottom } from '../../hook/use-search-input-bottom.hook';
import { cn } from '../../utils/cn.util';
import { SearchInput } from '../search-input/search-input';

interface Props {
    readonly search: string;
    readonly placeholder: string;
    readonly onSearchChange: (search: string) => void;
    readonly testID?: string;
}

const KEYBOARD_GAP = 4;
const INPUT_Z_INDEX = 20;

export const SearchablePageSearchInput = ({ search, placeholder, onSearchChange, testID }: Props) => {
    const bottom = useSearchInputBottom();
    const { setSearchActive } = useCollapsibleChromeSearch();
    const isFocused = useRef(false);
    const inputStyle = { bottom, zIndex: INPUT_Z_INDEX };
    const keyboardOffset = { closed: 0, opened: bottom - KEYBOARD_GAP };

    const handleFocus = () => {
        isFocused.current = true;
        setSearchActive(true);
    };

    const handleBlur = () => {
        isFocused.current = false;
        setSearchActive(isNotEmptyString(search));
    };

    const handleSearchChange = (value: string) => {
        onSearchChange(value);
        setSearchActive(isFocused.current || isNotEmptyString(value));
    };

    return (
        <KeyboardStickyView offset={keyboardOffset} style={inputStyle} className="absolute inset-x-0">
            <View className="pt-md">
                <View className="absolute inset-x-0 -top-[60px] -bottom-[500px]" pointerEvents="none">
                    <View className="h-[44px] bg-linear-to-b from-surface/0 to-surface" />
                    <View className="flex-1 bg-surface" />
                </View>
                <View className={cn('px-5xl', READABLE_CONTENT_CLASSNAME)}>
                    <SearchInput
                        value={search}
                        onChangeText={handleSearchChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholder={placeholder}
                        testID={testID}
                        containerClassName="h-[44px]"
                        returnKeyType="search"
                    />
                </View>
            </View>
        </KeyboardStickyView>
    );
};
