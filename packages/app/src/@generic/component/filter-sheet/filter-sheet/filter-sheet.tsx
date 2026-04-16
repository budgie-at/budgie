import { ReactNode, createContext, useContext, useState } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useFormsheetListStyles } from '../../../hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';

interface Props {
    readonly children: ReactNode;
}

interface FilterSheetContextValue {
    readonly drawerHeight: number;
    readonly setDrawerHeight: (height: number) => void;
}

const FilterSheetContext = createContext<FilterSheetContextValue | null>(null);

export const useFilterSheetContext = (): FilterSheetContextValue => {
    const context = useContext(FilterSheetContext);
    if (!isDefined(context)) {
        throw new Error('useFilterSheetContext must be used within FilterSheet');
    }

    return context;
};

export const FilterSheet = ({ children }: Props) => {
    const { backgroundColor } = useFormsheetListStyles();
    const [drawerHeight, setDrawerHeight] = useState(0);
    const containerStyle = { flex: 1, backgroundColor };
    const contextValue = { drawerHeight, setDrawerHeight };

    return (
        <FilterSheetContext value={contextValue}>
            <View style={containerStyle}>{children}</View>
        </FilterSheetContext>
    );
};
