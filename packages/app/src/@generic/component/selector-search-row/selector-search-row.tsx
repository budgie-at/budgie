import { ReactNode } from 'react';
import { View } from 'react-native';

import { SearchInput } from '../search-input/search-input';

interface Props {
    readonly search: string;
    readonly onSearchChange: (value: string) => void;
    readonly placeholder: string;
    readonly children?: ReactNode;
    readonly testID?: string;
    readonly autoFocus?: boolean;
}

export const SelectorSearchRow = ({ search, onSearchChange, placeholder, children, testID, autoFocus }: Props) => (
    <View className="flex-row items-center gap-x-md">
        <SearchInput
            containerClassName="h-auto min-h-[44px] flex-1 rounded-3xl border-0 bg-surface-fill px-md"
            inputClassName="ml-md min-h-[44px] text-[17px]"
            clearButtonClassName="h-[44px] w-[44px]"
            maxFontSizeMultiplier={1.6}
            placeholder={placeholder}
            value={search}
            onChangeText={onSearchChange}
            testID={testID}
            autoFocus={autoFocus}
        />
        {children}
    </View>
);
