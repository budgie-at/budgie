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
            containerClassName="h-[40px] flex-1 rounded-3xl border-0 bg-surface-fill px-md"
            inputClassName="-my-[2px] ml-md h-[44px] text-[17px]"
            placeholder={placeholder}
            value={search}
            onChangeText={onSearchChange}
            testID={testID}
        />
        {children}
    </View>
);
