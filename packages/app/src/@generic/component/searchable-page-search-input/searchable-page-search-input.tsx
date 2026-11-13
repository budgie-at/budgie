import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { useSearchInputBottom } from '../../hook/use-search-input-bottom.hook';
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
    const inputStyle = { bottom, zIndex: INPUT_Z_INDEX };
    const keyboardOffset = { closed: 0, opened: bottom - KEYBOARD_GAP };

    return (
        <KeyboardStickyView offset={keyboardOffset} style={inputStyle} className="absolute inset-x-0">
            <View className="px-5xl pt-md">
                <View className="absolute inset-x-0 -top-[8px] -bottom-[500px]" pointerEvents="none">
                    <View className="h-[20px] bg-linear-to-b from-surface/0 to-surface" />
                    <View className="flex-1 bg-surface" />
                </View>
                <SearchInput
                    value={search}
                    onChangeText={onSearchChange}
                    placeholder={placeholder}
                    testID={testID}
                    containerClassName="h-[44px]"
                    returnKeyType="search"
                />
            </View>
        </KeyboardStickyView>
    );
};
