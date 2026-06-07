import { ReactNode } from 'react';
import { View } from 'react-native';

import { SearchInput } from '../search-input/search-input';

interface Props {
    readonly search: string;
    readonly onSearchChange: (value: string) => void;
    readonly placeholder: string;
    readonly children?: ReactNode;
    readonly testID?: string;
}

export const SelectorSearchRow = ({ search, onSearchChange, placeholder, children, testID }: Props) => (
    <View className="flex-row items-center gap-x-md">
        <SearchInput
            containerClassName="h-[44px] flex-1"
            placeholder={placeholder}
            value={search}
            onChangeText={onSearchChange}
            testID={testID}
        />
        {children}
    </View>
);
